from app.core.database import SessionLocal
from app.models.db import UiString

# key -> {language_code: value}
STRINGS: dict[str, dict[str, str]] = {
    "chat.app_bar_title": {
        "en": "Support Assistant",
        "fr": "Assistant Support",
        "am": "የድጋፍ ረዳት",
        "ti": "ናይ ደገፍ ሓጋዚ",       # best-effort, needs native review
        "om": "Gargaaraa Deeggarsaa",  # best-effort, needs native review
    },
    "chat.welcome_message": {
        "en": "Hi! Please enter your phone number to get started.",
        "fr": "Bonjour ! Veuillez entrer votre numéro de téléphone pour commencer.",
        "am": "ሰላም! ለመጀመር እባክዎ የስልክ ቁጥርዎን ያስገቡ።",
        "ti": "ሰላም! ንምጅማር በጃኹም ቁጽሪ ተሌፎንኩም ኣእትዉ።",  # best-effort, needs native review
        "om": "Akkam! Itti fufuuf maaloo lakkoofsa bilbila keessan galchaa.",  # best-effort, needs native review
    },
    "chat.input_hint": {
        "en": "Ask something...",
        "fr": "Posez une question...",
        "am": "የሆነ ነገር ይጠይቁ...",
        "ti": "ገለ ሕተት...",           # best-effort, needs native review
        "om": "Waa'ee gaafadhu...",   # best-effort, needs native review
    },
    "chat.copied": {
        "en": "Copied",
        "fr": "Copié",
        "am": "ተቀድቷል",
        "ti": "ተቐዲሑ",       # best-effort, needs native review
        "om": "Garagalfameera",  # best-effort, needs native review
    },
    "common.cancel": {
        "en": "Cancel",
        "fr": "Annuler",
        "am": "ይቅር",
        "ti": "ሰርዝ",     # best-effort, needs native review
        "om": "Haqi",     # best-effort, needs native review
    },
    "chat.save_and_resend": {
        "en": "Save & resend",
        "fr": "Enregistrer et renvoyer",
        "am": "አስቀምጥ እና እንደገና ላክ",
        "ti": "ዓቅብ እሞ ደጊምካ ስደድ",       # best-effort, needs native review
        "om": "Olkaa'i fi deebi'ii ergi",     # best-effort, needs native review
    },
    "chat.stage_thinking": {
        "en": "Thinking…",
        "fr": "Réflexion…",
        "am": "በማሰብ ላይ…",
        "ti": "ይሓስብ ኣሎ…",      # best-effort, needs native review
        "om": "Yaaduu…",        # best-effort, needs native review
    },
    "chat.stage_validating": {
        "en": "Validating…",
        "fr": "Validation…",
        "am": "በማረጋገጥ ላይ…",
        "ti": "የረጋግጽ ኣሎ…",     # best-effort, needs native review
        "om": "Mirkaneessuu…",  # best-effort, needs native review
    },
    "chat.stage_generating": {
        "en": "Generating a response…",
        "fr": "Génération d'une réponse…",
        "am": "ምላሽ በመፍጠር ላይ…",
        "ti": "ምላሽ ይፈጥር ኣሎ…",         # best-effort, needs native review
        "om": "Deebii uumaa jira…",     # best-effort, needs native review
    },
    "voice.listening": {
        "en": "Listening…",
        "fr": "Écoute…",
        "am": "በማዳመጥ ላይ…",
        "ti": "ይሰምዕ ኣሎ…",   # best-effort, needs native review
        "om": "Dhaga'aa jira…",  # best-effort, needs native review
    },
    "voice.thinking": {
        "en": "Thinking…",
        "fr": "Réflexion…",
        "am": "በማሰብ ላይ…",
        "ti": "ይሓስብ ኣሎ…",      # best-effort, needs native review
        "om": "Yaaduu…",        # best-effort, needs native review
    },
    "voice.speaking_interrupt": {
        "en": "Speaking… (tap to interrupt)",
        "fr": "Parle… (touchez pour interrompre)",
        "am": "በመናገር ላይ… (ለማቋረጥ ይንኩ)",
        "ti": "ይዛረብ ኣሎ… (ንምቁራጽ ጠውቑ)",      # best-effort, needs native review
        "om": "Dubbachaa jira… (dhaabuuf tuqi)",  # best-effort, needs native review
    },
    "voice.mic_error": {
        "en": "Microphone error — tap to retry",
        "fr": "Erreur de microphone — touchez pour réessayer",
        "am": "የማይክሮፎን ስህተት — እንደገና ለመሞከር ይንኩ",
        "ti": "ጌጋ ማይክሮፎን — ደጊምካ ንምፍታን ጠውቑ",         # best-effort, needs native review
        "om": "Dogoggora maayikiroofoonii — irra deebi'anii yaaluuf tuqi",  # best-effort, needs native review
    },
    "voice.speech_unavailable": {
        "en": "Speech recognition unavailable on this device",
        "fr": "Reconnaissance vocale indisponible sur cet appareil",
        "am": "የንግግር ማወቂያ በዚህ መሳሪያ ላይ አይገኝም",
        "ti": "ኣፍልጦ ዘረባ ኣብዚ መሳርሒ የለን",                # best-effort, needs native review
        "om": "Beekumsi sagalee meeshaa kana irratti hin argamu",  # best-effort, needs native review
    },
    "voice.no_match_retry": {
        "en": "Didn't catch that — listening again…",
        "fr": "Je n'ai pas compris — j'écoute à nouveau…",
        "am": "አልተረዳሁም — እንደገና በማዳመጥ ላይ…",
        "ti": "ኣይተረድኣንን — ደጊመ እሰምዕ ኣሎኹ…",     # best-effort, needs native review
        "om": "Hin argisiifne — irra deebi'ee dhaggeeffachaa…",  # best-effort, needs native review
    },
    "voice.generic_error": {
        "en": "Something went wrong — tap to retry",
        "fr": "Une erreur s'est produite — touchez pour réessayer",
        "am": "የሆነ ስህተት ተከስቷል — እንደገና ለመሞከር ይንኩ",
        "ti": "ገለ ጌጋ ተፈጢሩ — ደጊምካ ንምፍታን ጠውቑ",       # best-effort, needs native review
        "om": "Wanti tokko dogoggore — irra deebi'anii yaaluuf tuqi",  # best-effort, needs native review
    },
    "voice.starting": {
        "en": "Starting…",
        "fr": "Démarrage…",
        "am": "በመጀመር ላይ…",
        "ti": "ይጅምር ኣሎ…",   # best-effort, needs native review
        "om": "Jalqabaa…",   # best-effort, needs native review
    },
    "common.select_language": {
        "en": "Select language",
        "fr": "Choisir la langue",
        "am": "ቋንቋ ይምረጡ",
        "ti": "ቋንቋ ምረጹ",     # best-effort, needs native review
        "om": "Afaan filadhu",  # best-effort, needs native review
    },
}


def run():
    db = SessionLocal()
    try:
        upserted = 0
        for key, translations in STRINGS.items():
            for language_code, value in translations.items():
                row = (
                    db.query(UiString)
                    .filter(UiString.key == key, UiString.language_code == language_code)
                    .first()
                )
                if row:
                    row.value = value
                else:
                    db.add(UiString(key=key, language_code=language_code, value=value))
                    upserted += 1
        db.commit()
        print(f"Seeded/updated {upserted} new ui_strings rows "
              f"({len(STRINGS)} keys x up to 5 languages each).")
        print("REMINDER: Tigrinya and Oromo entries are best-effort drafts -- "
              "get a native speaker to review them via /admin/ui-strings "
              "before this reaches real users.")
    finally:
        db.close()


if __name__ == "__main__":
    run()