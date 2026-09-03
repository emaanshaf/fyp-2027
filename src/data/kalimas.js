// The six Kalimas.
//
// Arabic, transliteration and translation. The Arabic here is the wording as
// it is traditionally taught and printed in the subcontinental "six kalimas"
// tradition; it is included in full rather than paraphrased.
//
// A note that belongs in the app, not hidden in a comment: only the first
// (the Shahadah) is a pillar of Islam with an established textual basis in the
// Quran and Sunnah. The set of six as a numbered list is a teaching
// convention, not a scriptural enumeration — the UI says so.

export const KALIMAS = [
  {
    id: 1,
    name: 'Kalima Tayyibah',
    arabicName: 'ٱلْكَلِمَةُ ٱلطَّيِّبَة',
    meaning: 'The Word of Purity',
    arabic: 'لَا إِلٰهَ إِلَّا ٱللهُ مُحَمَّدٌ رَسُولُ ٱللهِ',
    transliteration: 'La ilaha illallahu Muhammadur Rasulullah',
    translation:
      'There is no god but Allah; Muhammad is the Messenger of Allah.',
    note:
      'The Shahadah — the declaration of faith and the first pillar of Islam.',
  },
  {
    id: 2,
    name: 'Kalima Shahadat',
    arabicName: 'كَلِمَةُ ٱلشَّهَادَة',
    meaning: 'The Word of Testimony',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا ٱللهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration:
      "Ash-hadu an la ilaha illallahu wahdahu la sharika lahu wa ash-hadu anna Muhammadan 'abduhu wa rasuluh",
    translation:
      'I bear witness that there is no god but Allah, alone, without partner; and I bear witness that Muhammad is His servant and His Messenger.',
    note: 'Recited in the tashahhud of every prayer.',
  },
  {
    id: 3,
    name: 'Kalima Tamjeed',
    arabicName: 'كَلِمَةُ ٱلتَّمْجِيد',
    meaning: 'The Word of Glorification',
    arabic:
      'سُبْحَانَ ٱللهِ وَٱلْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا ٱللهُ وَٱللهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration:
      "Subhanallahi walhamdu lillahi wa la ilaha illallahu wallahu akbar, wa la hawla wa la quwwata illa billahil 'aliyyil 'azim",
    translation:
      'Glory be to Allah, and praise be to Allah, and there is no god but Allah, and Allah is the Greatest. There is no power and no strength except with Allah, the Most High, the Most Great.',
  },
  {
    id: 4,
    name: 'Kalima Tawheed',
    arabicName: 'كَلِمَةُ ٱلتَّوْحِيد',
    meaning: 'The Word of Oneness',
    arabic:
      'لَا إِلٰهَ إِلَّا ٱللهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ أَبَدًا أَبَدًا ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ بِيَدِهِ ٱلْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "La ilaha illallahu wahdahu la sharika lah, lahul mulku wa lahul hamd, yuhyi wa yumit, wa huwa hayyun la yamutu abadan abada, dhul jalali wal ikram, biyadihil khayr, wa huwa 'ala kulli shay'in qadir",
    translation:
      'There is no god but Allah, alone, without partner. To Him belongs the dominion and to Him belongs all praise. He gives life and causes death, and He is Living and never dies. Owner of Majesty and Honour — in His hand is all good, and He has power over all things.',
  },
  {
    id: 5,
    name: 'Kalima Istighfar',
    arabicName: 'كَلِمَةُ ٱلِٱسْتِغْفَار',
    meaning: 'The Word of Seeking Forgiveness',
    arabic:
      'أَسْتَغْفِرُ ٱللهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً سِرًّا أَوْ عَلَانِيَةً وَأَتُوبُ إِلَيْهِ مِنَ ٱلذَّنْبِ ٱلَّذِي أَعْلَمُ وَمِنَ ٱلذَّنْبِ ٱلَّذِي لَا أَعْلَمُ إِنَّكَ أَنْتَ عَلَّامُ ٱلْغُيُوبِ وَسَتَّارُ ٱلْعُيُوبِ وَغَفَّارُ ٱلذُّنُوبِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللهِ ٱلْعَلِيِّ ٱلْعَظِيمِ',
    transliteration:
      "Astaghfirullaha rabbi min kulli dhambin adhnabtuhu 'amadan aw khata'an sirran aw 'alaniyah, wa atubu ilayhi minadh-dhambil-ladhi a'lamu wa minadh-dhambil-ladhi la a'lam, innaka anta 'allamul ghuyub wa sattarul 'uyub wa ghaffarudh-dhunub, wa la hawla wa la quwwata illa billahil 'aliyyil 'azim",
    translation:
      'I seek forgiveness from Allah, my Lord, for every sin I committed knowingly or unknowingly, secretly or openly. I turn to Him from the sin I know and the sin I do not know. Indeed You are the Knower of the unseen, the Concealer of faults and the Forgiver of sins. There is no power and no strength except with Allah, the Most High, the Most Great.',
  },
  {
    id: 6,
    name: 'Kalima Radd-e-Kufr',
    arabicName: 'كَلِمَةُ رَدِّ ٱلْكُفْر',
    meaning: 'The Word of Rejecting Disbelief',
    arabic:
      'اَللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ بِهِ وَأَسْتَغْفِرُكَ لِمَا لَا أَعْلَمُ بِهِ تُبْتُ عَنْهُ وَتَبَرَّأْتُ مِنَ ٱلْكُفْرِ وَٱلشِّرْكِ وَٱلْكِذْبِ وَٱلْغِيبَةِ وَٱلْبِدْعَةِ وَٱلنَّمِيمَةِ وَٱلْفَوَاحِشِ وَٱلْبُهْتَانِ وَٱلْمَعَاصِي كُلِّهَا وَأَسْلَمْتُ وَأَقُولُ لَا إِلٰهَ إِلَّا ٱللهُ مُحَمَّدٌ رَسُولُ ٱللهِ',
    transliteration:
      "Allahumma inni a'udhu bika min an ushrika bika shay'an wa ana a'lamu bih, wa astaghfiruka lima la a'lamu bih, tubtu 'anhu wa tabarra'tu minal kufri wash-shirki wal kidhbi wal ghibati wal bid'ati wan-namimati wal fawahishi wal buhtani wal ma'asi kulliha, wa aslamtu wa aqulu la ilaha illallahu Muhammadur Rasulullah",
    translation:
      'O Allah, I seek refuge in You from knowingly associating anything with You, and I seek Your forgiveness for what I do not know of it. I repent from it and free myself from disbelief, associating partners with Allah, falsehood, backbiting, innovation, tale-bearing, indecency, slander and all acts of disobedience. I submit, and I say: there is no god but Allah, Muhammad is the Messenger of Allah.',
  },
];

/** Shown above the list so the numbering is not mistaken for scripture. */
export const KALIMAS_NOTE =
  'The first Kalima is the Shahadah, a pillar of Islam. The set of six as a '
  + 'numbered list is a long-standing teaching convention used across the '
  + 'subcontinent rather than an enumeration found in the Quran or Sunnah. '
  + 'Wordings vary slightly between printed collections.';

export default KALIMAS;
