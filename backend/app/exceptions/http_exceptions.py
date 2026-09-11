from fastapi import HTTPException, status


def not_found(resource: str = "Resource") -> HTTPException:
    """Standard 404 Not Found exception."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found"
    )


def bad_request(detail: str = "Bad request") -> HTTPException:
    """Standard 400 Bad Request exception."""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail
    )


def forbidden(detail: str = "Insufficient permissions") -> HTTPException:
    """Standard 403 Forbidden exception."""
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail
    )


def unauthorized(detail: str = "Could not validate credentials") -> HTTPException:
    """Standard 401 Unauthorized exception."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def conflict(detail: str = "Resource conflict") -> HTTPException:
    """Standard 409 Conflict exception."""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail
    )
