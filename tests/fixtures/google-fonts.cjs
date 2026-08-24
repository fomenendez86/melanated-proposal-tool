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

module.exports = {
  "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap": geist,
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap": geistMono,
};
