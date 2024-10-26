import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/graphql.ts',
  output: {
    file: 'dist/graphql.js',
    format: 'esm',
    name: 'logger',
  },
  plugins: [typescript(), commonjs(), resolve()],
}
