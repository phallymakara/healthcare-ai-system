import os
import uuid
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, unquote
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("azure_storage")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class AzureBlobStorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME or "public-profiles"
        self.custom_domain = settings.AZURE_STORAGE_CUSTOM_DOMAIN
        self._client = None
        self._container_client = None

    @property
    def is_configured(self) -> bool:
        """Check if Azure Storage credentials are configured."""
        return bool(self.connection_string and self.connection_string.strip())

    def _get_container_client(self):
        """Lazy-initialize Azure Blob Container Client."""
        if not self.is_configured:
            return None

        if self._container_client is None:
            try:
                from azure.storage.blob import BlobServiceClient
                self._client = BlobServiceClient.from_connection_string(self.connection_string)
                self._container_client = self._client.get_container_client(self.container_name)
                # Attempt to create container if it does not exist
                try:
                    if not self._container_client.exists():
                        self._container_client.create_container(public_access="blob")
                except Exception as ex:
                    logger.warning(f"Could not verify/create container '{self.container_name}': {ex}")
            except Exception as e:
                logger.error(f"Failed to initialize Azure Blob Client: {e}")
                self._container_client = None

        return self._container_client

    def _extract_blob_name_from_url(self, blob_url: str) -> Optional[str]:
        """Extract blob name relative to container from an Azure or mock URL."""
        if not blob_url:
            return None
        parsed = urlparse(blob_url)
        path = unquote(parsed.path).lstrip("/")
        
        # If local upload URL: /assets/uploads/{blob_name} or legacy /assets/mock-uploads/{blob_name}
        if "mock-uploads/" in path:
            return path.split("mock-uploads/", 1)[1]
        if "assets/uploads/" in path:
            return path.split("assets/uploads/", 1)[1]

        # Standard Azure path format: .../{container_name}/{blob_name}
        if f"{self.container_name}/" in path:
            return path.split(f"{self.container_name}/", 1)[1]

        parts = path.split("/", 1)
        if len(parts) == 2 and parts[0] == self.container_name:
            return parts[1]
        elif len(parts) >= 1:
            return parts[-1] if len(parts) == 1 else parts[1]
        return None

    def _build_public_url(self, blob_name: str) -> str:
        """Construct public URL for the blob."""
        if self.custom_domain:
            domain = self.custom_domain.rstrip("/")
            return f"{domain}/{self.container_name}/{blob_name}"
        container_client = self._get_container_client()
        if container_client:
            blob_client = container_client.get_blob_client(blob_name)
            return blob_client.url
        return f"https://azure-storage/{self.container_name}/{blob_name}"

    async def _read_and_validate_file(self, file: UploadFile) -> bytes:
        """Validate MIME type and size limit, returning raw file bytes."""
        content_type = file.content_type or ""
        if content_type.lower() not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image type '{content_type}'. Allowed types: JPEG, PNG, WEBP."
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of 5MB ({len(content)} bytes)."
            )
        
        # Reset file pointer for future reads if needed
        await file.seek(0)
        return content

    # -------------------------------------------------------------
    # CRUD Operations
    # -------------------------------------------------------------

    async def upload_raw_bytes(
        self,
        file_bytes: bytes,
        content_type: str,
        owner_prefix: str,
        subfolder: str = "",
        ext: str = "webp",
    ) -> Dict[str, Any]:
        """
        CREATE from bytes: Upload raw image bytes to isolated Azure Blob Storage path.
        """
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of 5MB ({len(file_bytes)} bytes)."
            )

        filename = f"{uuid.uuid4().hex}.{ext}"
        clean_prefix = owner_prefix.strip("/")
        if subfolder:
            blob_name = f"{clean_prefix}/{subfolder.strip('/')}/{filename}"
        else:
            blob_name = f"{clean_prefix}/{filename}"

        if not self.is_configured:
            # Azure Storage not configured — save to local volume served by Nginx.
            # The /app/uploads directory is a Docker volume mounted into both
            # the backend container (write) and the frontend/Nginx container (read).
            local_path = f"/app/uploads/{blob_name}"
            try:
                import os
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                with open(local_path, "wb") as f:
                    f.write(file_bytes)
                logger.info(f"Saved local upload to {local_path}")
            except Exception as e:
                logger.error(f"Failed to save local upload to {local_path}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save uploaded file. Please try again.",
                )
            local_url = f"/assets/uploads/{blob_name}"
            return {
                "url": local_url,
                "blob_name": blob_name,
                "content_type": content_type,
                "size": len(file_bytes),
                "is_mock": True,
            }

        container_client = self._get_container_client()
        if not container_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Azure Storage is temporarily unavailable. Please try again later."
            )

        try:
            from azure.storage.blob import ContentSettings
            blob_client = container_client.get_blob_client(blob_name)
            blob_client.upload_blob(
                file_bytes,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type),
            )
            public_url = self._build_public_url(blob_name)
            return {
                "url": public_url,
                "blob_name": blob_name,
                "content_type": content_type,
                "size": len(file_bytes),
                "is_mock": False,
            }
        except Exception as e:
            logger.error(f"Failed to upload raw bytes to blob '{blob_name}': {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image to cloud storage."
            )

    async def upload_asset(
        self,
        file: UploadFile,
        owner_prefix: str,
        subfolder: str = ""
    ) -> Dict[str, Any]:
        """
        CREATE: Upload a new profile asset strictly isolated to owner_prefix.
        e.g., owner_prefix = "hospitals/uuid-123", subfolder = "logo"
        """
        content = await self._read_and_validate_file(file)

        # Detect extension
        ext = "webp"
        if file.content_type == "image/jpeg":
            ext = "jpg"
        elif file.content_type == "image/png":
            ext = "png"
        elif file.filename and "." in file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()

        return await self.upload_raw_bytes(
            file_bytes=content,
            content_type=file.content_type or "image/webp",
            owner_prefix=owner_prefix,
            subfolder=subfolder,
            ext=ext,
        )

    async def get_asset_metadata(
        self,
        blob_url: str,
        required_prefix: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        READ: Retrieve asset metadata from Azure Blob Storage.
        """
        if not blob_url:
            return {"url": None, "exists": False, "size": None, "content_type": None}

        blob_name = self._extract_blob_name_from_url(blob_url)
        if not blob_name:
            return {"url": blob_url, "exists": False, "size": None, "content_type": None}

        # Multi-tenant isolation guard
        if required_prefix and not blob_name.startswith(required_prefix.strip("/")):
            return {"url": blob_url, "exists": False, "size": None, "content_type": None}

        if not self.is_configured:
            return {"url": blob_url, "exists": True, "size": None, "content_type": "image/webp"}

        container_client = self._get_container_client()
        if not container_client:
            return {"url": blob_url, "exists": True, "size": None, "content_type": None}

        try:
            blob_client = container_client.get_blob_client(blob_name)
            props = blob_client.get_blob_properties()
            return {
                "url": blob_url,
                "blob_name": blob_name,
                "exists": True,
                "size": props.size,
                "content_type": props.content_settings.content_type if props.content_settings else None,
                "last_modified": props.last_modified.isoformat() if props.last_modified else None
            }
        except Exception as e:
            logger.warning(f"Could not retrieve properties for blob '{blob_name}': {e}")
            return {"url": blob_url, "exists": False, "size": None, "content_type": None}

    async def replace_asset(
        self,
        file: UploadFile,
        owner_prefix: str,
        subfolder: str = "",
        old_blob_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        UPDATE: Upload new asset and atomically clean up the previous blob.
        """
        # Upload new asset first
        new_asset = await self.upload_asset(file, owner_prefix, subfolder)

        # Safely clean up old asset if it belongs to this owner
        if old_blob_url and old_blob_url != new_asset["url"]:
            try:
                await self.delete_asset(old_blob_url, required_prefix=owner_prefix)
            except Exception as e:
                logger.warning(f"Cleanup of replaced blob '{old_blob_url}' failed: {e}")

        return new_asset

    async def delete_asset(
        self,
        blob_url: str,
        required_prefix: str
    ) -> bool:
        """
        DELETE: Delete a blob from Azure Blob Storage with strict multi-tenant containment verification.
        """
        if not blob_url:
            return False

        blob_name = self._extract_blob_name_from_url(blob_url)
        if not blob_name:
            return False

        # STRICT ISOLATION GUARD: Blob must belong to caller's tenant prefix
        clean_prefix = required_prefix.strip("/")
        if not blob_name.startswith(clean_prefix):
            logger.warning(
                f"Unauthorized deletion attempt! Caller prefix: '{clean_prefix}', Target blob: '{blob_name}'"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot delete assets outside your account scope."
            )

        if not self.is_configured:
            # Attempt to delete from local volume if it exists
            local_path = f"/app/uploads/{blob_name}"
            try:
                import os
                if os.path.exists(local_path):
                    os.remove(local_path)
                    logger.info(f"Deleted local upload: {local_path}")
            except Exception as e:
                logger.warning(f"Could not delete local upload {local_path}: {e}")
            return True

        container_client = self._get_container_client()
        if not container_client:
            return False

        try:
            blob_client = container_client.get_blob_client(blob_name)
            if blob_client.exists():
                blob_client.delete_blob()
                logger.info(f"Successfully deleted Azure blob '{blob_name}'")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete blob '{blob_name}' from Azure Storage: {e}")
            return False

    # Convenience tenant path builders
    @staticmethod
    def hospital_logo_prefix(hospital_id: str) -> str:
        return f"hospitals/{hospital_id}"

    @staticmethod
    def doctor_photo_prefix(hospital_id: str, doctor_id: str) -> str:
        return f"hospitals/{hospital_id}/doctors/{doctor_id}"

    @staticmethod
    def user_avatar_prefix(user_id: str) -> str:
        return f"users/{user_id}"


# Global Singleton Service
azure_storage_service = AzureBlobStorageService()
