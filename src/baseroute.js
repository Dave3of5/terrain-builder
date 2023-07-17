let basename = '';

if (process.env.GITHUB_PAGES) {
  basename = `/${process.env.GITHUB_PAGES}`;
}
console.log(`basename: ${basename}`);

export default basename;
