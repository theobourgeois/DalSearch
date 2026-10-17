/** Each university's accent colour as the --accent and --accent-fg tokens in globals.css. */

type Rgb = [number, number, number];

const white: Rgb = [255, 255, 255];
/** globals.css's --accent-fg, the dark text on a light accent. */
const ink: Rgb = [23, 21, 13];
/** The dark theme's --panel. */
const darkPanel: Rgb = [20, 20, 22];

function parse(hex: string): Rgb {
    const value = hex.replace("#", "");
    return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16)) as Rgb;
}

/** WCAG relative luminance. */
function luminance(rgb: Rgb): number {
    const [r, g, b] = rgb.map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

const mix = (from: Rgb, to: Rgb, amount: number): Rgb =>
    from.map((channel, i) => Math.round(channel + (to[i] - channel) * amount)) as Rgb;

const inkOn = (rgb: Rgb): Rgb => (contrast(rgb, white) >= contrast(rgb, ink) ? white : ink);

/** White or dark text, whichever reads better on a colour. */
export function textOn(hex: string): string {
    return `rgb(${inkOn(parse(hex)).join(" ")})`;
}

/** The accent's channels and whichever of white or dark text reads better on it. */
function tokens(rgb: Rgb): string {
    const fg = inkOn(rgb);
    return `--accent:${rgb.join(" ")};--accent-fg:${fg.join(" ")}`;
}

/**
 * CSS that sets the accent for a university's pages. In the dark theme a navy or maroon accent would
 * vanish against the panels, so it's lightened until it stands out.
 */
export function accentCss(hex: string): string {
    const light = parse(hex);
    let dark = light;
    for (let step = 0; step < 12 && contrast(dark, darkPanel) < 3; step++) dark = mix(dark, white, 0.1);
    return `html:root{${tokens(light)}}html.dark{${tokens(dark)}}`;
}
