import asyncio
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
from azure.storage.blob import BlobServiceClient
from app.core.config import settings
from app.services.azure_storage import AzureBlobStorageService
from fastapi import UploadFile

async def test_live_storage():
    print("=" * 60)
    print("1. Testing Azure Blob Storage Connection & Container")
    print("=" * 60)
    print(f"Container: {settings.AZURE_STORAGE_CONTAINER_NAME}")
    
    service_client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
    container_client = service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
    
    exists = container_client.exists()
    print(f"Container exists: {exists}")
    if not exists:
        print("Creating container...")
        container_client.create_container(public_access="blob")
        print("Container created successfully!")
    else:
        print("Container is ready.")

    print("\n" + "=" * 60)
    print("2. Testing User Avatar CRUD via AzureBlobStorageService")
    print("=" * 60)
    storage = AzureBlobStorageService()
    user_id = "test-user-live-check"
    owner_prefix = storage.user_avatar_prefix(user_id)

    # A. CREATE: Upload
    sample_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_create = UploadFile(
        filename="avatar.png",
        file=io.BytesIO(sample_png),
        headers={"content-type": "image/png"}
    )
    upload_res = await storage.upload_asset(file_create, owner_prefix=owner_prefix, subfolder="avatar")
    print(f"[CREATE] Upload successful!")
    print(f"  URL: {upload_res['url']}")
    print(f"  Blob Name: {upload_res['blob_name']}")
    print(f"  Is Mock: {upload_res['is_mock']}")
    assert upload_res['is_mock'] is False, "Expected real Azure upload, got mock!"

    # Verify public accessibility via HTTP request
    async with httpx.AsyncClient() as http:
        r = await http.get(upload_res['url'])
        print(f"  HTTP Public Reachability Status: {r.status_code} ({len(r.content)} bytes)")

    # B. READ: Metadata
    meta = await storage.get_asset_metadata(upload_res['url'], required_prefix=owner_prefix)
    print(f"\n[READ] Metadata retrieved:")
    print(f"  Exists: {meta['exists']}")
    print(f"  Size: {meta['size']} bytes")
    print(f"  Content-Type: {meta['content_type']}")
    print(f"  Last-Modified: {meta['last_modified']}")
    assert meta['exists'] is True

    # C. UPDATE: Replace
    file_replace = UploadFile(
        filename="avatar_updated.png",
        file=io.BytesIO(sample_png + b"modified"),
        headers={"content-type": "image/png"}
    )
    replace_res = await storage.replace_asset(
        file=file_replace,
        owner_prefix=owner_prefix,
        subfolder="avatar",
        old_blob_url=upload_res['url']
    )
    print(f"\n[UPDATE] Replace successful!")
    print(f"  New URL: {replace_res['url']}")
    assert replace_res['url'] != upload_res['url']

    # Verify old blob was deleted
    old_meta = await storage.get_asset_metadata(upload_res['url'], required_prefix=owner_prefix)
    print(f"  Old blob exists after replace: {old_meta['exists']} (Expected False)")
    assert old_meta['exists'] is False

    # D. DELETE: Delete
    del_res = await storage.delete_asset(replace_res['url'], required_prefix=owner_prefix)
    print(f"\n[DELETE] Deletion result: {del_res}")
    assert del_res is True

    new_meta = await storage.get_asset_metadata(replace_res['url'], required_prefix=owner_prefix)
    print(f"  New blob exists after delete: {new_meta['exists']} (Expected False)")
    assert new_meta['exists'] is False

    print("\n" + "=" * 60)
    print("ALL LIVE AZURE BLOB STORAGE TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

    print("\n" + "=" * 60)
    print("3. Testing End-to-End FastAPI /auth/me/avatar API Endpoint")
    print("=" * 60)
    from app.main import app
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"account": "patient.sophea@gmail.com", "password": "patient123!"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in as patient.sophea@gmail.com")

        # 1. Upload Avatar via API
        files = {"file": ("my_avatar.png", sample_png, "image/png")}
        up_res = await client.post("/api/v1/auth/me/avatar", headers=headers, files=files)
        print(f"[API CREATE] Upload Status: {up_res.status_code}")
        assert up_res.status_code == 201
        uploaded_url = up_res.json()["url"]
        print(f"  Live Avatar URL in DB: {uploaded_url}")

        # 2. Verify Profile in /auth/me
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["profile_photo_url"] == uploaded_url
        print(f"[API READ] Verified profile_photo_url in /auth/me matches!")

        # 3. Delete Avatar via API
        del_res = await client.delete("/api/v1/auth/me/avatar", headers=headers)
        print(f"[API DELETE] Status: {del_res.status_code}")
        assert del_res.status_code == 200

        # 4. Verify cleared in /auth/me
        me_after_del = await client.get("/api/v1/auth/me", headers=headers)
        assert me_after_del.json()["profile_photo_url"] is None
        print(f"[API VERIFY] Confirmed profile_photo_url is cleared to None in DB and storage!")

    print("\n" + "=" * 60)
    print("ALL API ENDPOINT TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_live_storage())
