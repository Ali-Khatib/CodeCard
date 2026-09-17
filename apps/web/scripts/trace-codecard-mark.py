"""Trace the supplied CodeCard mark into SVG + transparent PNG assets."""

from pathlib import Path
import cv2
import numpy as np

SRC = Path(__file__).resolve().parents[1] / "src" / "assets" / "brand" / "codecard-mark-source.png"
OUT_DIR = Path(__file__).resolve().parents[1] / "src" / "assets" / "brand"
PUBLIC_DIR = Path(__file__).resolve().parents[1] / "public" / "brand"
APP_DIR = Path(__file__).resolve().parents[1] / "src" / "app"


def letterbox(src: np.ndarray, size: int) -> np.ndarray:
    h, w = src.shape[:2]
    scale = (size * 0.78) / max(h, w)
    nh, nw = max(1, int(round(h * scale))), max(1, int(round(w * scale)))
    resized = cv2.resize(src, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((size, size, 4), dtype=np.uint8)
    y0 = (size - nh) // 2
    x0 = (size - nw) // 2
    canvas[y0 : y0 + nh, x0 : x0 + nw] = resized
    return canvas


def cream_composite(mark: np.ndarray) -> np.ndarray:
    cream = np.full(mark.shape, (252, 241, 231, 255), dtype=np.uint8)
    alpha = (mark[:, :, 3] / 255.0)[..., None]
    return (mark * alpha + cream * (1 - alpha)).astype(np.uint8)


def main() -> None:
    img = cv2.imread(str(SRC), cv2.IMREAD_UNCHANGED)
    gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
    ink = gray < 150
    coords = cv2.findNonZero(ink.astype(np.uint8) * 255)
    x, y, w, h = cv2.boundingRect(coords)
    pad = 2
    x = max(0, x - pad)
    y = max(0, y - pad)
    w = min(gray.shape[1] - x, w + pad * 2)
    h = min(gray.shape[0] - y, h + pad * 2)
    cropped = gray[y : y + h, x : x + w]

    up = 16
    large_gray = cv2.resize(cropped, (w * up, h * up), interpolation=cv2.INTER_CUBIC)
    large_gray = cv2.GaussianBlur(large_gray, (9, 9), 0)
    _, mask = cv2.threshold(large_gray, 168, 255, cv2.THRESH_BINARY_INV)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if hierarchy is None:
        raise SystemExit("no contours")

    view = 64.0
    pad_vb = 3.0
    usable = view - pad_vb * 2
    scale = usable / max(mask.shape[1], mask.shape[0])
    drawn_w = mask.shape[1] * scale
    drawn_h = mask.shape[0] * scale
    tx = pad_vb + (usable - drawn_w) / 2
    ty = pad_vb + (usable - drawn_h) / 2

    paths: list[str] = []
    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, max(1.4, 0.0018 * peri), True)
        if len(approx) < 4:
            continue
        pts = approx.reshape(-1, 2).astype(np.float64)
        pts[:, 0] = pts[:, 0] * scale + tx
        pts[:, 1] = pts[:, 1] * scale + ty
        d = [f"M{pts[0,0]:.2f} {pts[0,1]:.2f}"]
        for x0, y0 in pts[1:]:
            d.append(f"L{x0:.2f} {y0:.2f}")
        d.append("Z")
        paths.append(" ".join(d))

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor" role="img">\n'
        f'  <path fill="currentColor" fill-rule="evenodd" d="{" ".join(paths)}"/>\n'
        "</svg>\n"
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "codecard-mark.svg").write_text(svg, encoding="utf8")
    (PUBLIC_DIR / "codecard-mark.svg").write_text(svg, encoding="utf8")

    rgba = np.zeros((mask.shape[0], mask.shape[1], 4), dtype=np.uint8)
    rgba[mask > 0] = (23, 23, 26, 255)

    for size in (32, 180, 512):
        boxed = letterbox(rgba, size)
        cv2.imwrite(str(OUT_DIR / f"codecard-mark-{size}.png"), cv2.cvtColor(boxed, cv2.COLOR_RGBA2BGRA))
        cv2.imwrite(str(PUBLIC_DIR / f"codecard-mark-{size}.png"), cv2.cvtColor(boxed, cv2.COLOR_RGBA2BGRA))

    fav32 = cream_composite(letterbox(rgba, 32))
    apple = cream_composite(letterbox(rgba, 180))
    cv2.imwrite(str(OUT_DIR / "favicon-32.png"), cv2.cvtColor(fav32, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(str(PUBLIC_DIR / "favicon-32.png"), cv2.cvtColor(fav32, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(str(OUT_DIR / "apple-touch-icon.png"), cv2.cvtColor(apple, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(str(PUBLIC_DIR / "apple-touch-icon.png"), cv2.cvtColor(apple, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(str(APP_DIR / "icon.png"), cv2.cvtColor(fav32, cv2.COLOR_RGBA2BGRA))
    cv2.imwrite(str(APP_DIR / "apple-icon.png"), cv2.cvtColor(apple, cv2.COLOR_RGBA2BGRA))

    print("contours", len(paths), "svg", len(svg))


if __name__ == "__main__":
    main()
