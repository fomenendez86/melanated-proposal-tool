import type { ErrorKey } from "./errorKeys";

// Every leaf is either a plain string or a function for the handful of
// strings that need interpolation (counts, dynamic labels/names). Every
// locale dictionary must implement this exact shape — a missing or
// mistyped key is a compile-time error, not a silent gap in production.
export interface Dictionary {
  common: {
    status: {
      draft: string;
      sent: string;
      viewed: string;
      approved: string;
      lost: string;
      archived: string;
    };
  };

  login: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    signIn: string;
    errorInvalid: string;
    errorRateLimited: string;
    errorDefault: string;
  };

  dashboard: {
    title: string;
    proposalCount: (n: number) => string;
    templatesLink: string;
    newProposal: string;
    logOut: string;
    searchLabel: string;
    searchPlaceholder: string;
    filterByStatus: string;
    statusAll: string;
    sortLabel: string;
    sortActivity: string;
    sortValue: string;
    sortName: string;
    noMatchTitle: string;
    noMatchDescription: string;
    columnName: string;
    columnClient: string;
    columnValue: string;
    columnStatus: string;
    columnDesign: string;
    columnPages: string;
    columnLastActivity: string;
    columnActions: string;
    openInEditor: (title: string) => string;
    preview: (title: string) => string;
    duplicate: (title: string) => string;
    restore: (title: string) => string;
    archive: (title: string) => string;
    deletePrompt: (title: string) => string;
    delete: (title: string) => string;
    genericError: string;
  };

  createDialog: {
    trigger: string;
    title: string;
    subtitle: string;
    close: string;
    clientLabel: string;
    clientSourceLabel: string;
    existing: string;
    new: string;
    noClientsYet: string;
    newClientNameLabel: string;
    newClientNamePlaceholder: string;
    newClientEmailLabel: string;
    newClientEmailPlaceholder: string;
    tripNameLabel: string;
    tripNamePlaceholder: string;
    designLabel: string;
    previewSuffix: string;
    startFromLabel: string;
    originLabel: string;
    originBlank: string;
    originDuplicate: string;
    originTemplate: string;
    proposalToDuplicateLabel: string;
    noProposalsToDuplicate: string;
    templateLabel: string;
    noTemplatesYet: string;
    chooseDesignError: string;
    chooseProposalError: string;
    chooseTemplateError: string;
    genericError: string;
    creating: string;
    createButton: string;
  };

  templateGallery: {
    backLink: string;
    title: string;
    count: (n: number) => string;
    noTemplatesTitle: string;
    noTemplatesDescription: string;
    manage: string;
    restore: (name: string) => string;
    archive: (name: string) => string;
    genericError: string;
    manageDialogTitle: string;
    close: string;
    nameLabel: string;
    descriptionLabel: string;
    saveNameButton: string;
    saving: string;
    enterNameError: string;
    refreshTitle: string;
    refreshDescription: string;
    sourceProposalLabel: string;
    noProposalsAvailable: string;
    refreshButton: string;
    refreshing: string;
    chooseSourceProposalError: string;
  };

  saveAsTemplate: {
    trigger: string;
    dialogTitle: string;
    dialogDescription: string;
    close: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    saveButton: string;
    saving: string;
    savedTitle: string;
    savedDescription: string;
    done: string;
  };

  shareButton: {
    trigger: string;
    disabledTitle: string;
    dialogTitle: string;
    dialogDescription: string;
    close: string;
    readyTitle: string;
    readyDescription: (days: string, hasPassword: boolean) => string;
    shareUrlLabel: string;
    copy: string;
    copied: string;
    openShared: string;
    expirationLabel: string;
    days7: string;
    days30: string;
    days90: string;
    days365: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    createButton: string;
    creating: string;
  };

  pdfButton: {
    generate: string;
    generating: string;
    downloaded: string;
    retry: string;
    disabledTitle: string;
  };

  editor: {
    toolbar: {
      review: string;
      openPageNav: string;
      openCatalog: string;
      catalogTitle: string;
      openDocStructure: string;
      docStructureTitle: string;
      previousPage: string;
      nextPage: string;
      pageOf: (n: number, total: number) => string;
      fitWidth: string;
      fitWidthTitle: string;
      openProperties: string;
      designChangeFailed: string;
      zoomOut: string;
      zoomIn: string;
      zoomLevel: string;
      pagesCount: (n: number) => string;
    };
    saveState: {
      loaded: string;
      dirty: string;
      saving: string;
      saved: string;
      error: string;
    };
    discardConfirm: string;
    designUnavailable: string;
    designUnsupported: (types: string) => string;
    switchDesignConfirm: (name: string) => string;
    designChangeError: string;
    variantSaveError: string;
    editingAnnouncement: (label: string) => string;
    editFieldAria: (label: string) => string;
    editImageFieldAria: (label: string) => string;
    imagePopoverReplaceAria: (label: string) => string;
    imagePopoverPlaceholder: string;
    imagePopoverHint: string;
    brandLogoAria: string;
    canvasAria: string;

    properties: {
      header: string;
      inspectorModeLabel: string;
      content: string;
      design: string;
      previewOnlyTitle: string;
      previewOnlyDescription: string;
      designVersionInfo: (version: number, format: string, orientation: string) => string;
      documentDesignLabel: string;
      previewSuffix: string;
      incompatibleSuffix: string;
      approvedLayoutTitle: string;
      defaultBadge: string;
      protectedLayoutTitle: string;
      protectedLayoutDescription: string;
      designSafeTitle: string;
      designSafeDescription: string;
      pageInformation: string;
      pageLabel: string;
      pageOf: (n: number, total: number) => string;
      blockType: string;
      previewLabel: string;
      rendered: string;
      printSafeTitle: string;
      printSafeDescription: string;
    };

    form: {
      explicitSaveNotice: string;
      saveNow: string;
      changesSaved: string;
      checkFields: string;
    };

    review: {
      header: string;
      readiness: string;
      readyToPreview: string;
      itemsToReview: (n: number) => string;
      description: string;
      allChecksPassedTitle: string;
      allChecksPassedDescription: (designName: string) => string;
      unsavedTitle: string;
      unsavedDescription: string;
      designChangeFailedTitle: string;
      overflowTitle: string;
      overflowDescription: (pages: string) => string;
      pageIssuesTitle: string;
      pageStatus: (status: string) => string;
      compatibilityTitle: string;
      unsupportedList: (list: string) => string;
      currentDocumentTitle: string;
      designLabel: string;
      renderedPagesLabel: string;
      pageFormatLabel: string;
    };

    drawer: {
      pageNavigator: string;
      pageProperties: string;
      proposalReview: string;
      contextualCatalog: string;
      documentStructure: string;
    };

    pageNavigator: {
      header: string;
      close: string;
      searchLabel: string;
      searchPlaceholder: string;
      navAriaLabel: string;
      noMatchTitle: string;
      noMatchDescription: string;
      movedAnnouncement: (title: string) => string;
      moveFailedAnnouncement: (title: string) => string;
      renderedPagesCount: (n: number) => string;
    };

    catalog: {
      header: string;
      close: string;
      contentTypeLabel: string;
      hotels: string;
      excursions: string;
      searchLabel: string;
      searchPlaceholder: (mode: string) => string;
      filterCountry: string;
      allCountries: string;
      filterRegion: string;
      allRegions: string;
      filterCity: string;
      allCities: string;
      newItemTitle: (kind: string) => string;
      updateItemTitle: (kind: string) => string;
      createHelp: string;
      updateHelp: string;
      cityLabel: string;
      selectCity: string;
      hotelNameLabel: string;
      hotelNamePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      roomCategoryLabel: string;
      mealPlanLabel: string;
      imageUrlLabel: string;
      imageUrlPlaceholder: string;
      excursionTitleLabel: string;
      excursionTitlePlaceholder: string;
      basePriceLabel: string;
      priceUnitLabel: string;
      perPerson: string;
      perGroup: string;
      perVehicle: string;
      priceNoteLabel: string;
      priceNotePlaceholder: string;
      cancel: string;
      saving: string;
      createAndAdd: string;
      updateCatalogDefault: string;
      createMissing: (kind: string) => string;
      hotelKind: string;
      excursionKind: string;
      addToProposal: string;
      adding: string;
      added: string;
      proposalOnlyNote: string;
      noMatchesTitle: string;
      noMatchesDescription: string;
      dragAria: (label: string) => string;
      previewAria: (label: string) => string;
    };

    composition: {
      header: string;
      close: string;
      addSectionTitle: string;
      addSectionHelp: (designName: string) => string;
      sectionTypeLabel: string;
      add: string;
      deletedBadge: string;
      hiddenBadge: string;
      visibleBadge: string;
      restore: string;
      moveUp: (label: string) => string;
      moveDown: (label: string) => string;
      show: (label: string) => string;
      hide: (label: string) => string;
      duplicate: (label: string) => string;
      deleteConfirm: (label: string) => string;
      delete: (label: string) => string;
    };

    insertionGap: {
      insertAria: (position: string) => string;
      menuLabel: string;
      adding: string;
      addedAnnouncement: (label: string, position: string) => string;
      atStart: string;
      afterSection: (title: string) => string;
    };

    itinerary: {
      header: string;
      description: string;
      densityLabel: string;
      expanded: string;
      condensed: string;
      overflowTitle: string;
      overflowDescription: (days: string) => string;
      dayFallback: (n: number) => string;
      dateNotSet: string;
      activityCount: (n: number) => string;
      moveDayUp: string;
      moveDayDown: string;
      dateLabel: string;
      datePlaceholder: string;
      subtitleLabel: string;
      subtitlePlaceholder: string;
      highlightLabel: string;
      highlightPlaceholder: string;
      activitiesTitle: string;
      add: string;
      activityTimeAria: (day: number, n: number) => string;
      activityDescAria: (day: number, n: number) => string;
      activityTimePlaceholder: string;
      activityDescPlaceholder: string;
      moveActivityUp: string;
      moveActivityDown: string;
      deleteActivity: string;
      narrativeTitle: string;
      paragraphAria: (day: number, n: number) => string;
      paragraphPlaceholder: string;
      deleteParagraph: string;
      imagesTitle: string;
      imageAria: (day: number, n: number) => string;
      imagePlaceholder: string;
      moveImageUp: string;
      moveImageDown: string;
      deleteImage: string;
      duplicateDay: string;
      deleteDay: string;
      deleteDayConfirm: (n: number) => string;
      addDay: string;
      savingItinerary: string;
      saveItinerary: (n: number) => string;
      itinerarySaved: string;
    };
  };

  addableSections: {
    triangleDivider: string;
    sectionDivider: string;
    thankYou: string;
  };

  editorUi: {
    closeLabel: (label: string) => string;
  };

  errors: Record<ErrorKey, string>;
}
