import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:markdown/markdown.dart' as md;

class TableCardBuilder extends MarkdownElementBuilder {
  @override
  Widget? visitElementAfter(md.Element element, TextStyle? preferredStyle) {
    if (element.tag != 'table') return null;

    List<String> headers = [];
    List<List<String>> rows = [];

    for (final child in element.children ?? []) {
      if (child is! md.Element) continue;

      if (child.tag == 'thead') {
        final tr = child.children?.whereType<md.Element>().firstOrNull;
        if (tr != null) {
          headers = (tr.children ?? [])
              .whereType<md.Element>()
              .map((th) => th.textContent)
              .toList();
        }
      }

      if (child.tag == 'tbody') {
        for (final tr in (child.children ?? []).whereType<md.Element>()) {
          final cells = (tr.children ?? [])
              .whereType<md.Element>()
              .map((td) => td.textContent)
              .toList();
          rows.add(cells);
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: rows.map((cells) {
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE4E4E7)),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x0D000000),
                  blurRadius: 4,
                  offset: Offset(0, 1)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (cells.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    cells[0],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ...List.generate(cells.length - 1, (i) {
                final cellIndex = i + 1;
                final label =
                    cellIndex < headers.length ? headers[cellIndex] : '';
                final value = cells[cellIndex];
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: Color(0xFFF4F4F5))),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 90,
                        child: Text(
                          label,
                          style: const TextStyle(
                              fontSize: 11, color: Color(0xFFA1A1AA)),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          value,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF3F3F46),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      }).toList(),
    );
  }
}
