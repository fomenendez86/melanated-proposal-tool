const geist = `
  @font-face {
    font-family: 'Geist';
    font-style: normal;
    font-weight: 100 900;
    src: local('Arial');
  }
`;

const geistMono = `
  @font-face {
    font-family: 'Geist Mono';
    font-style: normal;
    font-weight: 100 900;
    src: local('Courier New');
  }
`;

const sourceSerif4 = `
  @font-face {
    font-family: 'Source Serif 4';
    font-style: normal;
    font-weight: 200 900;
    src: local('Georgia');
  }
`;

const allura = `
  @font-face {
    font-family: 'Allura';
    font-style: normal;
    font-weight: 400;
    src: local('Segoe Script'), local('Comic Sans MS');
  }
`;

const prata = `
  @font-face {
    font-family: 'Prata';
    font-style: normal;
    font-weight: 400;
    src: local('Times New Roman');
  }
`;

module.exports = {
  "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap": geist,
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap": geistMono,
  "https://fonts.googleapis.com/css2?family=Allura:wght@400&display=swap": allura,
  "https://fonts.googleapis.com/css2?family=Prata:wght@400&display=swap": prata,
  "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@200..900&display=swap": sourceSerif4,
};
