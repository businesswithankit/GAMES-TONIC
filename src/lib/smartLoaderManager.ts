import app, { auth, db, firestore } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

export interface StartupTasksState {
  firebaseInitialized: boolean;
  authInitialized: boolean;
  rtdbConnected: boolean;
  firestoreConnected: boolean;
  settingsLoaded: boolean;
  navigationLoaded: boolean;
  homeContentLoaded: boolean;
  categoriesLoaded: boolean;
  socialLinksLoaded: boolean;
  aboveFoldImagesReady: boolean;
}

type Listener = (state: StartupTasksState, completed: boolean, percentage: number, currentStatusText: string) => void;

class SmartLoaderManager {
  private static instance: SmartLoaderManager;
  private isInitialStartupCompleted: boolean = false;
  private listeners: Set<Listener> = new Set();
  
  private tasks: StartupTasksState = {
    firebaseInitialized: false,
    authInitialized: false,
    rtdbConnected: false,
    firestoreConnected: false,
    settingsLoaded: false,
    navigationLoaded: false,
    homeContentLoaded: false,
    categoriesLoaded: false,
    socialLinksLoaded: false,
    aboveFoldImagesReady: false,
  };

  private constructor() {
    this.initVerification();
  }

  public static getInstance(): SmartLoaderManager {
    if (!SmartLoaderManager.instance) {
      SmartLoaderManager.instance = new SmartLoaderManager();
    }
    return SmartLoaderManager.instance;
  }

  private initVerification() {
    // 1. Verify Firebase initialized
    if (app && app.name) {
      this.tasks.firebaseInitialized = true;
    }

    // 2. Verify Firestore connected/initialized
    if (firestore) {
      this.tasks.firestoreConnected = true;
    }

    // 3. Verify Firebase Authentication initialized
    try {
      const unsubAuth = onAuthStateChanged(auth, () => {
        this.tasks.authInitialized = true;
        this.notify();
        unsubAuth();
      }, () => {
        // Fallback if auth check errors
        this.tasks.authInitialized = true;
        this.notify();
      });
    } catch {
      this.tasks.authInitialized = true;
    }

    // 4. Verify Realtime Database connected
    try {
      const connectedRef = ref(db, '.info/connected');
      onValue(connectedRef, (snap) => {
        if (snap.val() === true || snap.exists()) {
          this.tasks.rtdbConnected = true;
          this.notify();
        }
      }, () => {
        this.tasks.rtdbConnected = true;
        this.notify();
      });
    } catch {
      this.tasks.rtdbConnected = true;
    }

    // 5. Preload above the fold images automatically
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = '/icon.svg';
      img.onload = () => {
        this.tasks.aboveFoldImagesReady = true;
        this.notify();
      };
      img.onerror = () => {
        this.tasks.aboveFoldImagesReady = true;
        this.notify();
      };
      setTimeout(() => {
        this.tasks.aboveFoldImagesReady = true;
        this.notify();
      }, 500);
    }
  }

  public markTask(taskName: keyof StartupTasksState, value: boolean = true) {
    if (this.tasks[taskName] !== value) {
      this.tasks[taskName] = value;
      this.notify();
    }
  }

  public setSettingsDataLoaded(hasSettings: boolean, hasMenus: boolean, hasCategories: boolean, hasSocialLinks: boolean) {
    this.tasks.settingsLoaded = hasSettings;
    this.tasks.navigationLoaded = hasMenus;
    this.tasks.categoriesLoaded = hasCategories;
    this.tasks.socialLinksLoaded = hasSocialLinks;
    this.notify();
  }

  public setHomeContentLoaded(hasContent: boolean) {
    this.tasks.homeContentLoaded = hasContent;
    this.notify();
  }

  public hasCompletedInitialLoad(): boolean {
    return this.isInitialStartupCompleted;
  }

  public isAllTasksCompleted(): boolean {
    return Object.values(this.tasks).every(val => val === true);
  }

  public getPercentage(): number {
    const total = Object.keys(this.tasks).length;
    const completed = Object.values(this.tasks).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  }

  public getCurrentStatusText(): string {
    if (!this.tasks.firebaseInitialized || !this.tasks.firestoreConnected) {
      return "🎮 Preparing Your Gaming Experience...";
    }
    if (!this.tasks.authInitialized) {
      return "🚀 Loading Epic Adventures...";
    }
    if (!this.tasks.rtdbConnected) {
      return "🔥 Powering Up the Game Zone...";
    }
    if (!this.tasks.settingsLoaded) {
      return "🎲 Unlocking Awesome Content...";
    }
    if (!this.tasks.navigationLoaded || !this.tasks.categoriesLoaded) {
      return "🕹️ Loading the Ultimate Gaming Hub...";
    }
    if (!this.tasks.socialLinksLoaded) {
      return "🌟 Welcome to GAMES TONIC";
    }
    if (!this.tasks.homeContentLoaded) {
      return "🎮 Discovering Amazing Games...";
    }
    if (!this.tasks.aboveFoldImagesReady) {
      return "🛡️ Loading New Adventures...";
    }
    return "🏁 Get Ready to Play...";
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Send immediate current state
    listener(
      { ...this.tasks },
      this.isAllTasksCompleted(),
      this.getPercentage(),
      this.getCurrentStatusText()
    );
    return () => {
      this.listeners.delete(listener);
    };
  }

  public markInitialStartupCompleted() {
    this.isInitialStartupCompleted = true;
  }

  public triggerManualSync() {
    this.isInitialStartupCompleted = false;
    this.tasks.rtdbConnected = false;
    this.tasks.homeContentLoaded = false;
    this.notify();
  }

  private notify() {
    const allDone = this.isAllTasksCompleted();
    if (allDone) {
      this.isInitialStartupCompleted = true;
    }
    const percent = this.getPercentage();
    const text = this.getCurrentStatusText();
    this.listeners.forEach(listener => {
      listener({ ...this.tasks }, allDone, percent, text);
    });
  }
}

export const smartLoaderManager = SmartLoaderManager.getInstance();
export default smartLoaderManager;
