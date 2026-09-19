import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class MarkdownWithCards extends StatelessWidget {
  final String content;
  final MarkdownStyleSheet styleSheet;

  const MarkdownWithCards({
    super.key,
    required this.content,
    required this.styleSheet,
  });

  List<String> _cells(String line) {
    var value = line.trim();
    if (value.startsWith('|')) value = value.substring(1);
    if (value.endsWith('|')) value = value.substring(0, value.length - 1);
    return value.split('|').map((cell) => cell.trim()).toList();
  }

  bool _isTableRow(String line) => line.trim().contains('|');

  bool _isSeparator(String line) =>
      _isTableRow(line) &&
      _cells(line).every((cell) => RegExp(r'^:?-{3,}:?$').hasMatch(cell));

  List<Widget> _buildBlocks(BuildContext context) {
    final lines = content.split('\n');
    final blocks = <Widget>[];
    var prose = <String>[];
    var index = 0;

    void flushProse() {
      final text = prose.join('\n').trim();
      if (text.isNotEmpty) {
        blocks.add(MarkdownBody(
          data: text,
          selectable: true,
          styleSheet: styleSheet,
        ));
      }
      prose = [];
    }

    while (index < lines.length) {
      if (index + 1 < lines.length &&
          _isTableRow(lines[index]) &&
          _isSeparator(lines[index + 1])) {
        flushProse();
        final headers = _cells(lines[index]);
        final rows = <List<String>>[];
        index += 2;
        while (index < lines.length && _isTableRow(lines[index])) {
          rows.add(_cells(lines[index]));
          index++;
        }
        blocks.add(_cards(headers, rows));
        continue;
      }
      prose.add(lines[index]);
      index++;
    }
    flushProse();
    return blocks;
  }

  Widget _cards(List<String> headers, List<List<String>> rows) {
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
                offset: Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (cells.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    cells.first,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ...List.generate(cells.length - 1, (offset) {
                final cellIndex = offset + 1;
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
                          cellIndex < headers.length ? headers[cellIndex] : '',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFFA1A1AA),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          cells[cellIndex],
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

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _buildBlocks(context),
      );
}
