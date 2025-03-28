import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';
import registryItems from '../registry.json';

/**
 * Function to build the merged registry.json file.
 * It searches for all registry-item.json files in the registry directory,
 * removes the $schema property, and merges them into the base registry.json items array.
 */
async function buildRegistryFile() {
  const registryJsonPath = path.join(process.cwd(), 'registry.json');
  const registryJsonContent = await fs.readFile(registryJsonPath, 'utf-8');
  const registryData = JSON.parse(registryJsonContent);
  const registryFolderPath = path.join(process.cwd(), 'registry');
  const newItems = await getRegistryItemsFromFolder(registryFolderPath);

  registryData.items = [
    {
      name: 'index',
      type: 'registry:style',
      dependencies: [
        'tailwindcss-animate',
        'class-variance-authority',
        'lucide-react',
      ],
      registryDependencies: ['utils'],
      files: [],
      tailwind: {
        config: {
          plugins: ['require("tailwindcss-animate")'],
        },
      },
      cssVars: {},
    },
    ...newItems,
  ];

  await fs.writeFile(registryJsonPath, JSON.stringify(registryData, null, 2));
}

/**
 * Recursively search for registry-item.json files in a given directory.
 * @param dir - Directory to search in.
 * @returns An array of registry item objects.
 */
async function getRegistryItemsFromFolder(dir: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];
  // Read directory entries with file type information
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Define the expected path of registry-item.json in the current directory
      const registryItemPath = path.join(fullPath, 'registry-item.json');
      try {
        // Check if registry-item.json exists in this directory
        await fs.access(registryItemPath);
        // Read and parse the registry item file
        const content = await fs.readFile(registryItemPath, 'utf-8');
        const item = JSON.parse(content);
        // Remove the $schema property if it exists
        if (item.$schema) {
          delete item.$schema;
        }
        items.push(item);
      } catch {
        // If registry-item.json does not exist in the current directory,
        // recursively search in the subdirectories
        const subItems = await getRegistryItemsFromFolder(fullPath);
        items.push(...subItems);
      }
    }
  }
  return items;
}

/**
 * Function to build the registry index file.
 * This function reads the registry.json items and builds a dynamic index file.
 */
async function buildRegistryIndex() {
  let index = `/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// This file is autogenerated by scripts/build-registry.ts
// Do not edit this file directly.
import * as React from "react"

export const index: Record<string, any> = {`;

  // Remove duplicates: only keep the last item with a given name
  const uniqueItemsMap = new Map<string, (typeof registryItems.items)[0]>();
  // Use the base items from registry.json merged file
  for (const item of registryItems.items) {
    if (uniqueItemsMap.has(item.name)) {
      console.warn(
        `Duplicate item name detected: ${item.name}. Overwriting previous entry.`,
      );
    }
    uniqueItemsMap.set(item.name, item);
  }

  // Process only unique items
  for (const item of uniqueItemsMap.values()) {
    // Skip items without files
    if (!item.files) continue;

    console.log('Processing item:', item.name);
    // Define the component path from the first file if exists
    const componentPath = item.files[0]?.path ? `@/${item.files[0].path}` : '';

    // Read files and add content preserving newlines
    const filesWithContent = await Promise.all(
      item.files.map(async (file) => {
        const filePath = typeof file === 'string' ? file : file.path;
        const resolvedFilePath = path.resolve(filePath);

        try {
          // Read the file content (preserving newlines)
          const content = await fs.readFile(resolvedFilePath, 'utf-8');
          const processedContent = content.trim(); // Trim leading/trailing spaces
          return {
            path: filePath,
            type: file.type || 'unknown',
            target: file.target || '',
            content: processedContent, // Keep original formatting (newlines will be \n in JSON)
          };
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
          return {
            path: filePath,
            type: file.type || 'unknown',
            target: file.target || '',
            content: '',
          };
        }
      }),
    );

    index += `
  "${item.name}": {
    name: ${JSON.stringify(item.name)},
    description: ${JSON.stringify(item.description ?? '')},
    type: "${item.type}",
    dependencies: ${JSON.stringify(item.dependencies)},
    devDependencies: ${JSON.stringify(item.devDependencies)},
    registryDependencies: ${JSON.stringify(item.registryDependencies)},
    files: ${JSON.stringify(filesWithContent, null, 2)},
    component: ${
      componentPath
        ? `React.lazy(async () => {
      const mod = await import("${componentPath}")
      const exportName = Object.keys(mod).find(key => typeof mod[key] === 'function' || typeof mod[key] === 'object') || item.name
      return { default: mod.default || mod[exportName] }
    })`
        : 'null'
    },
    command: 'https://animate-ui.com/r/${item.name}',
  },`;
  }

  index += `
  }`;

  // Remove the previous registry index file and write the new one.
  rimraf.sync(path.join(process.cwd(), '__registry__/index.tsx'));
  await fs.writeFile(path.join(process.cwd(), '__registry__/index.tsx'), index);
}

/**
 * Function to build the registry.
 * It clears the previous registry directory, builds the registry files,
 * and replaces specific path strings in the generated files.
 */
async function buildRegistry() {
  // 1. Remove the previous registry directory
  const registryDir = path.join(process.cwd(), 'public/r');
  await fs.rm(registryDir, { recursive: true, force: true });
  await fs.mkdir(registryDir, { recursive: true });

  // 2. Build the registry using the shadcn build command
  await new Promise((resolve, reject) => {
    const process = exec(
      `pnpm dlx shadcn build registry.json --output ./public/r/`,
    );

    process.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });

  // 3. Replace `@/registry/animate-ui/` with `@/components/animate-ui/` in all files
  const files = await fs.readdir(path.join(process.cwd(), 'public/r'));

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(
        path.join(process.cwd(), 'public/r', file),
        'utf-8',
      );

      const registryItem = JSON.parse(content);

      // Replace `@/registry/animate-ui/` in file contents
      registryItem.files = registryItem.files?.map((file) => {
        if (file.content?.includes('@/registry/animate-ui')) {
          file.content = file.content?.replaceAll(
            '@/registry/animate-ui',
            '@/components/animate-ui',
          );
        }
        return file;
      });

      // Write the updated file back to disk
      await fs.writeFile(
        path.join(process.cwd(), 'public/r', file),
        JSON.stringify(registryItem, null, 2),
      );
    }),
  );
}

// Execute the build process in the following order:
// 1. Build the merged registry.json file with new items from registry-item.json files.
// 2. Build the registry index.
// 3. Build the registry.
try {
  console.log('🔨 Building merged registry file...');
  await buildRegistryFile();
  console.log('🗂️ Building registry/__index__.tsx...');
  await buildRegistryIndex();
  console.log('🏗️ Building registry...');
  await buildRegistry();
} catch (error) {
  console.error(error);
  process.exit(1);
}
