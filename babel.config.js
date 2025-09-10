module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router transformations
      require.resolve('expo-router/babel'),
      // Path alias to match tsconfig.json ("@/*" -> "./*")
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      // MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};

