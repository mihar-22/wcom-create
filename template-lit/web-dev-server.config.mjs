import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  watch: true,
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto' }),
  ],
};
