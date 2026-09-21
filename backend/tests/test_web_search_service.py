import pytest
from app.services.web_search_service import WebSearchService, ALLOWED_OFFICIAL_DOMAINS
from app.services.langchain_agent import HealthcareAgentService


@pytest.mark.asyncio
async def test_web_search_official_domains_allowlist():
    """Verify authorized domains strictly contain WHO and Cambodia MoH health portals."""
    assert "who.int" in ALLOWED_OFFICIAL_DOMAINS
    assert "moh.gov.kh" in ALLOWED_OFFICIAL_DOMAINS
    assert "cdcmoh.gov.kh" in ALLOWED_OFFICIAL_DOMAINS


@pytest.mark.asyncio
async def test_search_dengue_guidelines_english():
    """Verify search for dengue returns official WHO / MoH guidelines."""
    results = await WebSearchService.search_official_sources("dengue fever symptoms and treatment", language="en")
    assert len(results) > 0
    first = results[0]
    assert "dengue" in first["title"].lower() or "dengue" in first["url"].lower()
    assert any(d in first["url"] for d in ALLOWED_OFFICIAL_DOMAINS)
    assert first["source_name"] is not None
    assert first["snippet"] is not None


@pytest.mark.asyncio
async def test_search_rabies_guidelines_khmer():
    """Verify search for rabies in Khmer returns official Cambodia CDC MoH guidelines."""
    results = await WebSearchService.search_official_sources("ជំងឺឆ្កែឆ្កួត ខាំ", language="km")
    assert len(results) > 0
    first = results[0]
    assert "cdcmoh.gov.kh" in first["url"] or "who.int" in first["url"]
    assert "ឆ្កែឆ្កួត" in first["title"] or "CDC" in first["title"] or "WHO" in first["title"]


@pytest.mark.asyncio
async def test_search_hotline_emergency():
    """Verify query for Cambodia health emergency hotline returns MoH 115 / 119 info."""
    results = await WebSearchService.search_official_sources("លេខទូរស័ព្ទបន្ទាន់ ក្រសួងសុខាភិបាល 115", language="km")
    assert len(results) > 0
    found_115 = any("115" in r["title"] or "115" in r["snippet"] for r in results)
    assert found_115


@pytest.mark.asyncio
async def test_search_general_fallback():
    """Verify fallback returns WHO and MoH Cambodia portals even for open queries."""
    results = await WebSearchService.search_official_sources("general health policy", language="en")
    assert len(results) >= 2
    domains = [r["domain"] for r in results]
    assert any("who.int" in d for d in domains)
    assert any("moh.gov.kh" in d or "cdcmoh.gov.kh" in d for d in domains)
