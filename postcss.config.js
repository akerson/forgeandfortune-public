module.exports = {
  plugins: [
      require('cssnano')({
          preset: 'advanced',
      }),
      require('autoprefixer')
  ],
};