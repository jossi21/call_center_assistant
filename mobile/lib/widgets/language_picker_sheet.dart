import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/locale_service.dart';

Future<void> showLanguagePicker(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => const _LanguagePickerContent(),
  );
}

class _LanguagePickerContent extends StatelessWidget {
  const _LanguagePickerContent();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleService>();

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFE4E4E7),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  locale.t('common.select_language'),
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 8),
            if (locale.availableLanguages.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              )
            else
              ...locale.availableLanguages.map((lang) {
                final selected = lang.code == locale.languageCode;
                return ListTile(
                  title: Text(lang.name),
                  trailing: selected
                      ? const Icon(Icons.check_circle, color: Color(0xFF6366F1))
                      : null,
                  onTap: () {
                    locale.setLanguage(lang.code);
                    Navigator.of(context).pop();
                  },
                );
              }),
          ],
        ),
      ),
    );
  }
}
