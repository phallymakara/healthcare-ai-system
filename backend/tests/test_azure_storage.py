import io
import pytest
from fastapi import UploadFile, HTTPException
from app.services.azure_storage import AzureBlobStorageService, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE


@pytest.fixture
def storage_service():
    # Fresh instance without live credentials (graceful fallback mode)
    service = AzureBlobStorageService()
    service.connection_string = ""
    return service


def create_mock_upload_file(content: bytes, filename: str = "test.png", content_type: str = "image/png") -> UploadFile:
    file_obj = io.BytesIO(content)
    return UploadFile(filename=filename, file=file_obj, headers={"content-type": content_type})


@pytest.mark.asyncio
async def test_upload_asset_create(storage_service):
    """CREATE: Upload new asset returns valid path isolated under owner prefix."""
    file = create_mock_upload_file(b"dummy image bytes", filename="logo.png", content_type="image/png")
    result = await storage_service.upload_asset(
        file=file,
        owner_prefix="hospitals/hosp-123",
        subfolder="logo"
    )

    assert result["url"] is not None
    assert "hospitals/hosp-123/logo" in result["blob_name"]
    assert result["content_type"] == "image/png"
    assert result["size"] == len(b"dummy image bytes")


@pytest.mark.asyncio
async def test_read_asset_metadata(storage_service):
    """READ: Retrieve asset metadata respecting tenant isolation prefix."""
    mock_url = "/assets/mock-uploads/hospitals/hosp-123/logo/abc.png"
    
    # Authorized prefix match
    meta = await storage_service.get_asset_metadata(mock_url, required_prefix="hospitals/hosp-123")
    assert meta["url"] == mock_url
    assert meta["exists"] is True

    # Cross-tenant prefix mismatch should be blocked
    cross_meta = await storage_service.get_asset_metadata(mock_url, required_prefix="hospitals/hosp-999")
    assert cross_meta["exists"] is False


@pytest.mark.asyncio
async def test_replace_asset_update(storage_service):
    """UPDATE: Replace asset uploads new file and safely deletes previous blob."""
    old_url = "/assets/mock-uploads/hospitals/hosp-123/logo/old.png"
    new_file = create_mock_upload_file(b"new image content", filename="new_logo.webp", content_type="image/webp")

    result = await storage_service.replace_asset(
        file=new_file,
        owner_prefix="hospitals/hosp-123",
        subfolder="logo",
        old_blob_url=old_url
    )

    assert result["url"] != old_url
    assert "hospitals/hosp-123/logo" in result["blob_name"]
    assert result["content_type"] == "image/webp"


@pytest.mark.asyncio
async def test_delete_asset_isolated_guard(storage_service):
    """DELETE: Tenant isolation prevents deleting assets belonging to other owners."""
    target_blob_url = "https://azure-storage/public-profiles/hospitals/hosp-victim/logo/secret.png"

    # Attempt to delete using a different tenant prefix should raise 403
    with pytest.raises(HTTPException) as exc_info:
        await storage_service.delete_asset(
            blob_url=target_blob_url,
            required_prefix="hospitals/hosp-attacker"
        )
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_delete_asset_authorized(storage_service):
    """DELETE: Authorized tenant can successfully delete their own asset."""
    target_blob_url = "https://azure-storage/public-profiles/hospitals/hosp-owner/logo/my_logo.png"

    deleted = await storage_service.delete_asset(
        blob_url=target_blob_url,
        required_prefix="hospitals/hosp-owner"
    )
    assert deleted is True


@pytest.mark.asyncio
async def test_reject_invalid_mime_type(storage_service):
    """VALIDATION: Non-image MIME types are rejected with 400 Bad Request."""
    invalid_file = create_mock_upload_file(b"malicious content", filename="script.exe", content_type="application/x-msdownload")
    with pytest.raises(HTTPException) as exc_info:
        await storage_service.upload_asset(invalid_file, owner_prefix="users/u1", subfolder="avatar")
    assert exc_info.value.status_code == 400
    assert "Invalid image type" in exc_info.value.detail


@pytest.mark.asyncio
async def test_reject_oversized_file(storage_service):
    """VALIDATION: Files exceeding 5MB are rejected with 400 Bad Request."""
    large_bytes = b"0" * (MAX_FILE_SIZE + 1024)
    large_file = create_mock_upload_file(large_bytes, filename="huge.jpg", content_type="image/jpeg")
    with pytest.raises(HTTPException) as exc_info:
        await storage_service.upload_asset(large_file, owner_prefix="users/u1", subfolder="avatar")
    assert exc_info.value.status_code == 400
    assert "File exceeds maximum size" in exc_info.value.detail


@pytest.mark.asyncio
async def test_private_document_upload_read_and_isolation(storage_service, tmp_path, monkeypatch):
    """PRIVATE STORAGE: PDFs/images save privately, enforce magic bytes, and isolate by hospital prefix."""
    monkeypatch.setattr("app.services.azure_storage.settings.PRIVATE_UPLOADS_DIR", str(tmp_path))
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    pdf_file = create_mock_upload_file(pdf_bytes, filename="../../moh_license.pdf", content_type="application/pdf")

    owner_prefix = storage_service.hospital_document_prefix("hosp-private-1")
    result = await storage_service.upload_private_document(pdf_file, owner_prefix=owner_prefix)

    assert "url" not in result
    assert result["blob_name"].startswith("hospitals/hosp-private-1/documents/")
    assert result["original_filename"] == "moh_license.pdf"
    assert result["content_type"] == "application/pdf"

    # Authorized read succeeds
    loaded = await storage_service.read_private_document(
        blob_name=result["blob_name"],
        required_prefix=owner_prefix,
    )
    assert loaded == pdf_bytes

    # Cross-tenant read blocked with 403
    with pytest.raises(HTTPException) as exc_info:
        await storage_service.read_private_document(
            blob_name=result["blob_name"],
            required_prefix="hospitals/hosp-other/documents",
        )
    assert exc_info.value.status_code == 403

    # Delete succeeds for owner
    deleted = await storage_service.delete_private_document(
        blob_name=result["blob_name"],
        required_prefix=owner_prefix,
    )
    assert deleted is True


@pytest.mark.asyncio
async def test_private_document_rejects_spoofed_magic_bytes_and_invalid_type(storage_service):
    """PRIVATE STORAGE: Reject spoofed PDF headers and disallowed executable/HTML types."""
    spoofed = create_mock_upload_file(b"<html>not a pdf</html>", filename="fake.pdf", content_type="application/pdf")
    with pytest.raises(HTTPException) as exc_info:
        await storage_service.upload_private_document(spoofed, owner_prefix="hospitals/h1/documents")
    assert exc_info.value.status_code == 400

    exe_file = create_mock_upload_file(b"MZ...", filename="bad.exe", content_type="application/x-msdownload")
    with pytest.raises(HTTPException) as exc_info2:
        await storage_service.upload_private_document(exe_file, owner_prefix="hospitals/h1/documents")
    assert exc_info2.value.status_code == 400

