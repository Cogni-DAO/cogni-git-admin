# Build Shim Files

## Purpose
Contains static files that must be copied to the `/lib` build output directory to enable proper CommonJS/ESM interop for Probot v7.

## Files

### `package.json`
Forces the `/lib` directory to be treated as CommonJS, overriding the root package.json `"type": "module"` setting.

**Why needed**: 
- Root package.json declares `"type": "module"` for modern ESM support
- TypeScript compiles to `/lib` with CommonJS output (`module.exports`)  
- Node.js would treat `/lib/*.js` as ESM due to parent package.json
- This override ensures `/lib/*.js` files are loaded as CommonJS

## Build Process
The build script copies these files to `/lib` after TypeScript compilation:
```bash
npm run build  # Runs: tsc + copy shim files
```

## Future
When Probot upgrades to v12+ (native ESM support), this entire directory can be deleted.
Related work item: `3ec4c3ea-dd9c-4597-a96e-a0d69c626b80`