// Route name -> screen component.
//
// Kept beside the route table (src/config/routes.js) rather than inside the
// navigator so there is exactly one place that answers "what renders for this
// route". The navigator previously held two separate maps — one for tabs, one
// for drawer screens — which is how routes ended up registered in one and not
// the other.

import HomeScreen from '../screens/HomeScreen';
import QuranScreen from '../screens/QuranScreen';
import HadithScreen from '../screens/HadithScreen';
import DuasScreen from '../screens/DuasScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import ZakatScreen from '../screens/ZakatScreen';
import TasbihScreen from '../screens/TasbihScreen';
import RemindersScreen from '../screens/RemindersScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import GeneratorScreen from '../screens/GeneratorScreen';
import AIChatScreen from '../screens/AIChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NamesOfAllahScreen from '../screens/NamesOfAllahScreen';
import IslamicCalendarScreen from '../screens/IslamicCalendarScreen';
import PrayerTrackerScreen from '../screens/PrayerTrackerScreen';
import TafsirScreen from '../screens/TafsirScreen';
import HifzScreen from '../screens/HifzScreen';
import AIQuranAssistantScreen from '../screens/AIQuranAssistantScreen';
import AyahOfDayScreen from '../screens/AyahOfDayScreen';
import HadithVerificationScreen from '../screens/HadithVerificationScreen';
import DuaLibraryScreen from '../screens/DuaLibraryScreen';
import QiblaFinderScreen from '../screens/QiblaFinderScreen';
import RamadanModeScreen from '../screens/RamadanModeScreen';
import QuranJourneyScreen from '../screens/QuranJourneyScreen';
import IslamicQuizScreen from '../screens/IslamicQuizScreen';
import SeerahScreen from '../screens/SeerahScreen';
import ProphetsStoriesScreen from '../screens/ProphetsStoriesScreen';
import LearningPathScreen from '../screens/LearningPathScreen';
import ReviewSessionScreen from '../screens/ReviewSessionScreen';
import GoodDeedsScreen from '../screens/GoodDeedsScreen';
import ReflectionJournalScreen from '../screens/ReflectionJournalScreen';
import KhatmPlannerScreen from '../screens/KhatmPlannerScreen';
import LearnWorshipScreen from '../screens/LearnWorshipScreen';
import NotFoundScreen from '../screens/NotFoundScreen';

export const SCREENS = {
  Home: HomeScreen,
  Quran: QuranScreen,
  Prayer: PrayerTimesScreen,
  Duas: DuasScreen,

  Tafsir: TafsirScreen,
  Hifz: HifzScreen,
  AIQuran: AIQuranAssistantScreen,
  AyahOfDay: AyahOfDayScreen,
  Hadith: HadithScreen,
  HadithVerify: HadithVerificationScreen,
  NamesOfAllah: NamesOfAllahScreen,

  Calendar: IslamicCalendarScreen,
  PrayerTracker: PrayerTrackerScreen,
  DuaLibrary: DuaLibraryScreen,
  Qibla: QiblaFinderScreen,
  Ramadan: RamadanModeScreen,
  Zakat: ZakatScreen,
  Tasbih: TasbihScreen,

  Learning: LearningPathScreen,
  ReviewSession: ReviewSessionScreen,
  QuranJourney: QuranJourneyScreen,
  KhatmPlanner: KhatmPlannerScreen,
  Quiz: IslamicQuizScreen,
  Seerah: SeerahScreen,
  Prophets: ProphetsStoriesScreen,
  LearnWorship: LearnWorshipScreen,

  GoodDeeds: GoodDeedsScreen,
  Journal: ReflectionJournalScreen,
  Bookmarks: BookmarksScreen,
  AIChat: AIChatScreen,
  Settings: SettingsScreen,
  Reminders: RemindersScreen,

  Generator: GeneratorScreen,

  NotFound: NotFoundScreen,
};

/** Falls back to the 404 screen so a missing entry is visible, not blank. */
export const screenFor = name => SCREENS[name] || NotFoundScreen;

export default SCREENS;
