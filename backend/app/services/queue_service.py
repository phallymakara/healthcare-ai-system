import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models import (
    QueueSession,
    Ticket,
    TicketLog,
    Department,
    Doctor,
    User,
    TicketStatus,
    TicketSource,
    QueueStatus,
)
from app.services.wait_time_calculator import WaitTimeCalculator
from app.core.websocket import manager
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationType


class QueueService:
    @staticmethod
    async def get_or_create_queue_session(
        session: AsyncSession,
        hospital_id: uuid.UUID,
        department_id: uuid.UUID,
        doctor_id: Optional[uuid.UUID] = None,
        branch_id: Optional[uuid.UUID] = None,
    ) -> QueueSession:
        today = date.today()

        # Find existing active/paused session for today
        query = select(QueueSession).where(
            and_(
                QueueSession.hospital_id == hospital_id,
                QueueSession.department_id == department_id,
                QueueSession.doctor_id == doctor_id,
                QueueSession.session_date == today,
            )
        )
        res = await session.execute(query)
        queue_sess = res.scalar_one_or_none()

        if not queue_sess:
            queue_sess = QueueSession(
                id=uuid.uuid4(),
                hospital_id=hospital_id,
                branch_id=branch_id,
                department_id=department_id,
                doctor_id=doctor_id,
                session_date=today,
                status=QueueStatus.ACTIVE,
                total_issued_today=0,
            )
            session.add(queue_sess)
            await session.commit()
            await session.refresh(queue_sess)

        return queue_sess

    @staticmethod
    async def issue_ticket(
        session: AsyncSession,
        queue_session_id: uuid.UUID,
        patient_name: str,
        patient_phone: Optional[str] = None,
        patient_id: Optional[uuid.UUID] = None,
        doctor_id: Optional[uuid.UUID] = None,
        service_id: Optional[uuid.UUID] = None,
        ticket_source: TicketSource = TicketSource.ONLINE,
    ) -> Ticket:
        # 1. Lock and load QueueSession
        q_res = await session.execute(
            select(QueueSession)
            .where(QueueSession.id == queue_session_id)
            .with_for_update()
        )
        queue_sess = q_res.scalar_one_or_none()
        if not queue_sess:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        if queue_sess.status == QueueStatus.CLOSED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Queue is closed for today")

        # 2. Get Department code for prefix (e.g. CARD, DERM, GEN)
        dept_res = await session.execute(
            select(Department).where(Department.id == queue_sess.department_id)
        )
        dept = dept_res.scalar_one_or_none()
        prefix = dept.code if dept and dept.code else "TICK"
        avg_minutes = dept.avg_consultation_minutes if dept else 15

        # 3. Increment counter and format ticket number
        queue_sess.total_issued_today += 1
        ticket_seq = queue_sess.total_issued_today
        ticket_number = f"{prefix}-{ticket_seq:03d}"

        # 4. Determine current waiting count for position and wait time
        wait_count_res = await session.execute(
            select(func.count(Ticket.id)).where(
                and_(
                    Ticket.queue_session_id == queue_session_id,
                    Ticket.status.in_([TicketStatus.WAITING, TicketStatus.CALLED]),
                )
            )
        )
        waiting_ahead = wait_count_res.scalar() or 0
        position = waiting_ahead + 1
        est_wait = WaitTimeCalculator.calculate_wait_time(
            position_ahead=waiting_ahead,
            avg_consultation_minutes=avg_minutes,
            is_serving_in_progress=queue_sess.current_serving_ticket_id is not None,
        )

        # 5. Create Ticket
        new_ticket = Ticket(
            id=uuid.uuid4(),
            ticket_number=ticket_number,
            queue_session_id=queue_session_id,
            hospital_id=queue_sess.hospital_id,
            branch_id=queue_sess.branch_id,
            department_id=queue_sess.department_id,
            doctor_id=doctor_id or queue_sess.doctor_id,
            service_id=service_id,
            patient_id=patient_id,
            patient_name=patient_name.strip(),
            patient_phone=patient_phone.strip() if patient_phone else None,
            ticket_source=ticket_source,
            status=TicketStatus.WAITING,
            position=position,
            estimated_wait_minutes=est_wait,
        )
        session.add(new_ticket)
        await session.flush()

        # 6. Audit Log
        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=new_ticket.id,
            from_status=None,
            to_status=TicketStatus.WAITING,
            actor_id=patient_id,
            note=f"Ticket issued via {ticket_source.value}",
        )
        session.add(log)
        await session.commit()

        # 7. Real-time WebSocket event
        await manager.dispatch_queue_event(
            event_type="TICKET_CREATED",
            session_id=queue_session_id,
            hospital_id=queue_sess.hospital_id,
            data={
                "ticket_id": str(new_ticket.id),
                "ticket_number": new_ticket.ticket_number,
                "patient_name": new_ticket.patient_name,
                "position": new_ticket.position,
                "estimated_wait_minutes": new_ticket.estimated_wait_minutes,
            },
            ticket_id=new_ticket.id,
        )

        # 8. Notification Dispatch
        await NotificationService.dispatch(
            title="Ticket Confirmed",
            message=f"Ticket {new_ticket.ticket_number} is reserved. Position: #{new_ticket.position} (~{new_ticket.estimated_wait_minutes} mins).",
            notification_type=NotificationType.TICKET_BOOKED,
            user_id=new_ticket.patient_id,
            phone_number=new_ticket.patient_phone,
            ticket_id=new_ticket.id,
        )

        return new_ticket

    @staticmethod
    async def call_next_patient(
        session: AsyncSession,
        queue_session_id: uuid.UUID,
        staff_user: User,
        note: Optional[str] = None,
    ) -> Optional[Ticket]:
        # 1. Fetch next WAITING ticket
        query = (
            select(Ticket)
            .where(
                and_(
                    Ticket.queue_session_id == queue_session_id,
                    Ticket.status == TicketStatus.WAITING,
                )
            )
            .order_by(Ticket.created_at.asc())
            .with_for_update()
        )
        res = await session.execute(query)
        next_ticket = res.scalars().first()

        if not next_ticket:
            return None

        # 2. Update ticket to CALLED
        from_status = next_ticket.status
        next_ticket.status = TicketStatus.CALLED
        next_ticket.called_at = datetime.now(timezone.utc).replace(tzinfo=None)
        next_ticket.position = 0
        next_ticket.estimated_wait_minutes = 0

        # 3. Update QueueSession current serving display
        q_res = await session.execute(
            select(QueueSession).where(QueueSession.id == queue_session_id)
        )
        queue_sess = q_res.scalar_one()
        queue_sess.current_serving_ticket_id = next_ticket.id
        queue_sess.current_serving_number = next_ticket.ticket_number

        # 4. Audit Log
        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=next_ticket.id,
            from_status=from_status,
            to_status=TicketStatus.CALLED,
            actor_id=staff_user.id,
            note=note or f"Patient called by {staff_user.full_name}",
        )
        session.add(log)

        # 5. Recalculate remaining waiting tickets
        await QueueService._recalculate_waiting_positions(session, queue_session_id)
        await session.commit()

        # 6. Dispatch WebSocket Event
        await manager.dispatch_queue_event(
            event_type="PATIENT_CALLED",
            session_id=queue_session_id,
            hospital_id=queue_sess.hospital_id,
            data={
                "ticket_id": str(next_ticket.id),
                "ticket_number": next_ticket.ticket_number,
                "patient_name": next_ticket.patient_name,
                "called_by": staff_user.full_name,
            },
            ticket_id=next_ticket.id,
        )

        # 7. Notification Dispatch
        await NotificationService.dispatch(
            title="Now Serving - Your Turn!",
            message=f"Ticket {next_ticket.ticket_number} called by {staff_user.full_name}. Please proceed to the room.",
            notification_type=NotificationType.PATIENT_CALLED,
            user_id=next_ticket.patient_id,
            phone_number=next_ticket.patient_phone,
            ticket_id=next_ticket.id,
        )

        return next_ticket

    @staticmethod
    async def start_consultation(
        session: AsyncSession,
        ticket_id: uuid.UUID,
        staff_user: User,
        note: Optional[str] = None,
    ) -> Ticket:
        ticket = await QueueService._get_ticket_with_lock(session, ticket_id)
        from_status = ticket.status

        ticket.status = TicketStatus.SERVING
        ticket.serving_started_at = datetime.now(timezone.utc).replace(tzinfo=None)

        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            from_status=from_status,
            to_status=TicketStatus.SERVING,
            actor_id=staff_user.id,
            note=note or f"Consultation started by {staff_user.full_name}",
        )
        session.add(log)
        await session.commit()

        await manager.dispatch_queue_event(
            event_type="SERVING_STARTED",
            session_id=ticket.queue_session_id,
            hospital_id=ticket.hospital_id,
            data={"ticket_id": str(ticket.id), "ticket_number": ticket.ticket_number},
            ticket_id=ticket.id,
        )
        return ticket

    @staticmethod
    async def complete_consultation(
        session: AsyncSession,
        ticket_id: uuid.UUID,
        staff_user: User,
        note: Optional[str] = None,
    ) -> Ticket:
        ticket = await QueueService._get_ticket_with_lock(session, ticket_id)
        from_status = ticket.status

        ticket.status = TicketStatus.COMPLETED
        ticket.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        # Clear queue session current serving if this was the current ticket
        q_res = await session.execute(
            select(QueueSession).where(QueueSession.id == ticket.queue_session_id)
        )
        queue_sess = q_res.scalar_one_or_none()
        if queue_sess and queue_sess.current_serving_ticket_id == ticket.id:
            queue_sess.current_serving_ticket_id = None

        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            from_status=from_status,
            to_status=TicketStatus.COMPLETED,
            actor_id=staff_user.id,
            note=note or f"Consultation completed by {staff_user.full_name}",
        )
        session.add(log)

        # Recalculate remaining waiting tickets
        await QueueService._recalculate_waiting_positions(session, ticket.queue_session_id)
        await session.commit()

        await manager.dispatch_queue_event(
            event_type="TICKET_COMPLETED",
            session_id=ticket.queue_session_id,
            hospital_id=ticket.hospital_id,
            data={"ticket_id": str(ticket.id), "ticket_number": ticket.ticket_number},
            ticket_id=ticket.id,
        )
        return ticket

    @staticmethod
    async def skip_ticket(
        session: AsyncSession,
        ticket_id: uuid.UUID,
        staff_user: User,
        note: Optional[str] = None,
    ) -> Ticket:
        ticket = await QueueService._get_ticket_with_lock(session, ticket_id)
        from_status = ticket.status

        ticket.status = TicketStatus.SKIPPED
        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            from_status=from_status,
            to_status=TicketStatus.SKIPPED,
            actor_id=staff_user.id,
            note=note or "Patient skipped by counter staff",
        )
        session.add(log)
        await QueueService._recalculate_waiting_positions(session, ticket.queue_session_id)
        await session.commit()

        await manager.dispatch_queue_event(
            event_type="TICKET_SKIPPED",
            session_id=ticket.queue_session_id,
            hospital_id=ticket.hospital_id,
            data={"ticket_id": str(ticket.id), "ticket_number": ticket.ticket_number},
            ticket_id=ticket.id,
        )
        return ticket

    @staticmethod
    async def mark_no_show(
        session: AsyncSession,
        ticket_id: uuid.UUID,
        staff_user: User,
        note: Optional[str] = None,
    ) -> Ticket:
        ticket = await QueueService._get_ticket_with_lock(session, ticket_id)
        from_status = ticket.status

        ticket.status = TicketStatus.NO_SHOW
        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            from_status=from_status,
            to_status=TicketStatus.NO_SHOW,
            actor_id=staff_user.id,
            note=note or "Patient marked as no-show",
        )
        session.add(log)
        await QueueService._recalculate_waiting_positions(session, ticket.queue_session_id)
        await session.commit()

        await manager.dispatch_queue_event(
            event_type="TICKET_NO_SHOW",
            session_id=ticket.queue_session_id,
            hospital_id=ticket.hospital_id,
            data={"ticket_id": str(ticket.id), "ticket_number": ticket.ticket_number},
            ticket_id=ticket.id,
        )
        return ticket

    @staticmethod
    async def cancel_ticket(
        session: AsyncSession,
        ticket_id: uuid.UUID,
        user: User,
        note: Optional[str] = None,
    ) -> Ticket:
        ticket = await QueueService._get_ticket_with_lock(session, ticket_id)
        if ticket.status in [TicketStatus.COMPLETED, TicketStatus.CANCELLED]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is already completed or cancelled")

        from_status = ticket.status
        ticket.status = TicketStatus.CANCELLED

        log = TicketLog(
            id=uuid.uuid4(),
            ticket_id=ticket.id,
            from_status=from_status,
            to_status=TicketStatus.CANCELLED,
            actor_id=user.id,
            note=note or f"Cancelled by {user.full_name}",
        )
        session.add(log)
        await QueueService._recalculate_waiting_positions(session, ticket.queue_session_id)
        await session.commit()

        await manager.dispatch_queue_event(
            event_type="TICKET_CANCELLED",
            session_id=ticket.queue_session_id,
            hospital_id=ticket.hospital_id,
            data={"ticket_id": str(ticket.id), "ticket_number": ticket.ticket_number},
            ticket_id=ticket.id,
        )
        return ticket

    @staticmethod
    async def get_live_queue_snapshot(
        session: AsyncSession,
        queue_session_id: uuid.UUID,
    ) -> dict:
        # Load session with department & doctor
        q_res = await session.execute(
            select(QueueSession)
            .where(QueueSession.id == queue_session_id)
            .options(selectinload(QueueSession.department), selectinload(QueueSession.doctor))
        )
        queue_sess = q_res.scalar_one_or_none()
        if not queue_sess:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        # Load active tickets (WAITING, CALLED, SERVING)
        tickets_res = await session.execute(
            select(Ticket)
            .where(
                and_(
                    Ticket.queue_session_id == queue_session_id,
                    Ticket.status.in_([TicketStatus.SERVING, TicketStatus.CALLED, TicketStatus.WAITING]),
                )
            )
            .order_by(Ticket.position.asc(), Ticket.created_at.asc())
            .options(selectinload(Ticket.logs))
        )
        active_tickets = tickets_res.scalars().all()

        # Count completed
        completed_res = await session.execute(
            select(func.count(Ticket.id)).where(
                and_(
                    Ticket.queue_session_id == queue_session_id,
                    Ticket.status == TicketStatus.COMPLETED,
                )
            )
        )
        total_completed = completed_res.scalar() or 0
        total_waiting = len([t for t in active_tickets if t.status in [TicketStatus.WAITING, TicketStatus.CALLED]])

        avg_min = queue_sess.department.avg_consultation_minutes if queue_sess.department else 15
        est_for_new = WaitTimeCalculator.calculate_wait_time(
            position_ahead=total_waiting,
            avg_consultation_minutes=avg_min,
            is_serving_in_progress=queue_sess.current_serving_ticket_id is not None,
        )

        return {
            "session_id": queue_sess.id,
            "department_id": queue_sess.department_id,
            "department_name": queue_sess.department.name if queue_sess.department else "General",
            "doctor_id": queue_sess.doctor_id,
            "doctor_name": queue_sess.doctor.full_name if queue_sess.doctor else None,
            "status": queue_sess.status,
            "current_serving_number": queue_sess.current_serving_number,
            "current_serving_ticket_id": queue_sess.current_serving_ticket_id,
            "total_waiting": total_waiting,
            "total_completed_today": total_completed,
            "estimated_wait_minutes_for_new": est_for_new,
            "active_tickets": active_tickets,
        }

    # --- Internal Helpers ---

    @staticmethod
    async def _get_ticket_with_lock(session: AsyncSession, ticket_id: uuid.UUID) -> Ticket:
        res = await session.execute(
            select(Ticket).where(Ticket.id == ticket_id).with_for_update()
        )
        ticket = res.scalar_one_or_none()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        return ticket

    @staticmethod
    async def _recalculate_waiting_positions(session: AsyncSession, queue_session_id: uuid.UUID):
        """Update position and wait-time for all WAITING tickets in order"""
        dept_res = await session.execute(
            select(Department.avg_consultation_minutes)
            .join(QueueSession, QueueSession.department_id == Department.id)
            .where(QueueSession.id == queue_session_id)
        )
        avg_minutes = dept_res.scalar() or 15

        waiting_res = await session.execute(
            select(Ticket)
            .where(
                and_(
                    Ticket.queue_session_id == queue_session_id,
                    Ticket.status == TicketStatus.WAITING,
                )
            )
            .order_by(Ticket.created_at.asc())
            .with_for_update()
        )
        waiting_tickets = waiting_res.scalars().all()

        for idx, t in enumerate(waiting_tickets, start=1):
            t.position = idx
            t.estimated_wait_minutes = WaitTimeCalculator.calculate_wait_time(
                position_ahead=idx - 1,
                avg_consultation_minutes=avg_minutes,
                is_serving_in_progress=True,
            )
