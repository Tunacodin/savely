export default {
  // Common
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    search: "Search...",
    none: "None",
    error: "Error",
    continue: "Continue",
    or: "or",
  },

  // Tabs
  tabs: {
    home: "Home",
    collections: "Collections",
    search: "Search",
    profile: "Profile",
  },

  // Home
  home: {
    title: "Home",
  },

  // Search
  search: {
    placeholder: "Search...",
    noResults: "No results found",
  },

  // Collections
  collections: {
    title: "Collections",
    itemCount: "{{count}} items",
    empty: "No content in this collection yet",
    fallbackTitle: "Collection",
    newCollection: "New Collection",
    editCollection: "Edit Collection",
    deleteCollection: "Delete Collection",
    deleteConfirm: "Are you sure you want to delete this collection? Items won't be deleted.",
    name: "Name",
    namePlaceholder: "Collection name",
    icon: "Icon",
    bgColor: "Background Color",
    tapToChange: "Tap to change",
    searchPlaceholder: "Search collections...",
    selectEmoji: "Select Emoji",
    selectColor: "Select Color",
    create: "Create",
    giveName: "Name your collection..",
  },

  // Profile
  profile: {
    user: "User",
    savedContent: "Saved content",
    collection: "Collection",
    theme: "Theme",
    darkMode: "Dark Mode",
    language: "Language",
    goPremium: "Go Premium",
    accountSettings: "Account Settings",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    logout: "Log Out",
  },

  // Account Settings
  accountSettings: {
    title: "Account Settings",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    logoutConfirm: "Are you sure you want to log out?",
    deleteAccount: "Delete Account",
  },

  // Item Detail (Bottom Sheet)
  itemDetail: {
    watch: "Watch",
    open: "Open",
    share: "Share",
    deleteItem: "Delete Item",
    deleteConfirm: "Are you sure you want to delete this item?",
    addTitle: "Add title",
  },

  // Save Item Form
  saveForm: {
    title: "New content",
    link: "Link",
    linkPlaceholder: "https://...",
    itemTitle: "Title",
    titlePlaceholder: "Add a title (optional)",
    collection: "Collection",
  },

  // Auth
  auth: {
    loginTitle: "Log In",
    registerTitle: "Create Account",
    registerSubtitle: "Create an account to build your library.",
    loginSubtitle: "Continue with your email and password.",
    registerFormSubtitle: "Enter your info to create an account.",
    welcomeMessage: "Ready to manage your digital world and access everything from one place?",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    continueWithEmail: "Continue with Email",
    fullName: "Full Name",
    fullNamePlaceholder: "Your Name",
    fullNameRequired: "Full name is required",
    fullNameMin: "Must be at least 2 characters",
    email: "Email",
    emailPlaceholder: "example@email.com",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email",
    password: "Password",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 6 characters",
    register: "Sign Up",
    login: "Log In",
    alreadyHaveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    loginFailed: "Login Failed",
    loginFailedMessage: "Incorrect email or password. Please check your credentials and try again.",
    emailAlreadyRegistered: "Email already registered",
    emailAlreadyRegisteredMessage: "This email is already registered. Try logging in.",
    genericError: "An error occurred.",
    loginError: "Could not log in.",
  },

  // Onboarding
  onboarding: {
    page1Title: "End the Clutter",
    page1Desc: "Bring all those lost posts, videos, and articles from social media together in one safe place with Savely.",
    page2Title: "Build Your Digital Archive",
    page2Desc: "Categorize your favorite content to your taste. Leave the chaos behind and enjoy your personal library.",
    page3Title: "Find What You Need Instantly",
    page3Desc: "Stop wondering 'Where did I save that?' With advanced search, find anything among thousands of items instantly.",
    page4Title: "You're in Control",
    page4Desc: "If you're ready to manage your digital world and access everything from one place, start building your library now.",
    letsStart: "Let's get started!",
  },

  // Premium
  premium: {
    currentPlan: "Current Plan",
    features: "Premium Features",
    managePlan: "Manage Plan",
    goPremium: "Go Premium",
    autoRenew: "Subscription renews automatically. You can cancel anytime.",
    choosePlan: "Choose your plan",
    yearly: "Yearly",
    monthly: "Monthly",
    freeDesc: "Build your digital organization at a basic level. Create your library for free.",
    proDesc: "Remove all limits from your library. Easily organize thousands of items.",
    alreadyPremium: "Already Premium",
    upgradeToPremium: "Upgrade to Premium",
  },

  // Splash
  splash: {
    motto: "Save it. Find it. Keep it.",
  },
} as const;
