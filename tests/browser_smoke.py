"""Exercise the built tool at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import json
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "example-tool")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/example-tool/")
                page.wait_for_selector(".route")
                assert "26" == page.locator(".counts strong").first.inner_text()
                page.locator("#search").fill("WS1877")
                assert [n.inner_text() for n in page.locator(".counts strong").all()] == ["7","13"]
                page.locator("#issue").select_option("Ticket, Reservation and Loyalty Program")
                assert [n.inner_text() for n in page.locator(".counts strong").all()] == ["1","1"]
                page.locator("#search").fill("nonesuch")
                assert "No matching" in page.locator("#result").inner_text()
                page.locator("#search").fill("F81100")
                page.locator("#statement").select_option("Dismissed")
                assert page.locator(".counts strong").first.inner_text()=="4"
                page.locator("summary").click()
                row={"flightInfoLong":"F8-F81100-2024-01-27-YUL-FLL","airlineCode":"F8","flightNumber":"F81100","flightDateString":"2024-01-27","decisionNumber":"TEST","issueTier1En":"Flight Disruption","orderStatementEn":"Dismissed"}
                page.locator("#file").set_input_files({"name":"sample.json","mimeType":"application/json","buffer":json.dumps({"aaData":[row,{**row,"orderStatementEn":"Order to refund"}]}).encode()})
                page.wait_for_selector("#reset:visible")
                assert [n.inner_text() for n in page.locator(".counts strong").all()] == ["1","2"]
                page.locator("#reset").click()
                page.locator("summary").click()
                assert "26" == page.locator(".counts strong").first.inner_text()
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"), full_page=True)
                assert not errors, errors
                browser.close()
            print("Browser checks passed: project subpath, source data, interactive filters and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
