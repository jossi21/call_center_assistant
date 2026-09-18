import re


def _convert_table_to_text(table_block: str) -> str:
    """GFM tables can't render on WhatsApp/Telegram at all — convert each
    row into a readable card-like text block, mirroring the web UI's
    table-to-card treatment (first column as a title, remaining columns
    as label: value lines)."""
    lines = [l for l in table_block.strip().split("\n") if l.strip()]
    if len(lines) < 2:
        return table_block

    header_cells = [c.strip() for c in lines[0].strip("|").split("|")]
    body_lines = lines[2:]

    blocks = []
    for line in body_lines:
        cells = [c.strip() for c in line.strip("|").split("|")]
        if not cells or not cells[0]:
            continue
        block_lines = [f"*{cells[0]}*"]
        for i in range(1, min(len(cells), len(header_cells))):
            if cells[i]:
                block_lines.append(f"{header_cells[i]}: {cells[i]}")
        blocks.append("\n".join(block_lines))

    return "\n\n".join(blocks)


def _strip_tables(text: str) -> str:
    table_pattern = re.compile(
        r'(^\|.+\|[ \t]*\n\|[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)+\|?[ \t]*\n(?:\|.*\|[ \t]*\n?)+)',
        re.MULTILINE,
    )

    def replace(match):
        return _convert_table_to_text(match.group(1)) + "\n"

    return table_pattern.sub(replace, text)


def markdown_to_whatsapp(text: str) -> str:
    """Convert standard/GFM markdown (as produced by the LLM) into WhatsApp's
    own lightweight formatting syntax."""
    text = _strip_tables(text)

    text = re.sub(r'\*\*(.+?)\*\*', r'*\1*', text)
    text = re.sub(r'__(.+?)__', r'*\1*', text)
    text = re.sub(r'~~(.+?)~~', r'~\1~', text)
    text = re.sub(r'(?<!\*)\*(?!\*)([^\n*]+?)(?<!\*)\*(?!\*)', r'_\1_', text)
    text = re.sub(r'^#{1,6}\s*(.+)$', r'*\1*', text, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1: \2', text)
    text = re.sub(r'(?<!`)`([^`\n]+)`(?!`)', r'```\1```', text)
    text = re.sub(r'^[ \t]*[-*+][ \t]+', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'^[ \t]*(\d+)\.[ \t]+', r'\1. ', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


def markdown_to_telegram(text: str) -> str:
    """Convert GFM-style markdown into Telegram's legacy parse_mode=Markdown
    syntax (*bold*). Tables and headers have no equivalent, so they're
    converted; _italic_, `code`, ```pre```, and [text](url) already work
    natively in legacy mode and are left untouched."""
    text = _strip_tables(text)

    text = re.sub(r'\*\*(.+?)\*\*', r'*\1*', text)
    text = re.sub(r'__(.+?)__', r'*\1*', text)
    text = re.sub(r'^#{1,6}\s*(.+)$', r'*\1*', text, flags=re.MULTILINE)
    text = re.sub(r'~~(.+?)~~', r'\1', text)
    text = re.sub(r'^[ \t]*[-*+][ \t]+', '• ', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


# Maps a channel_name to its formatter. Channels not listed here (e.g. "web")
# get their text sent through unmodified, since the web widget renders raw
# GFM markdown directly.
CHANNEL_FORMATTERS = {
    "whatsapp": markdown_to_whatsapp,
    "telegram": markdown_to_telegram,
}


def format_for_channel(channel_name: str, text: str) -> str:
    formatter = CHANNEL_FORMATTERS.get(channel_name)
    return formatter(text) if formatter else text