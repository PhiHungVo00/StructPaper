import { UniversalTemplateSchema } from '@/types/template-builder';
import { TemplateManifest } from './types';
import { extractTemplateManifest, deserializeTemplatePackage } from './file-service';

const LOCAL_STORAGE_KEY = 'structpaper_custom_templates_list';

/**
 * Universal Template Registry & Storage Manager
 * Handles asynchronous and synchronous template resolution from JSON files,
 * API routes, and browser persistent storage.
 */
class TemplateRegistry {
  private memoryCache: Map<string, UniversalTemplateSchema> = new Map();

  /**
   * Register or cache a template schema in memory
   */
  public register(schema: UniversalTemplateSchema) {
    this.memoryCache.set(schema.id, schema);
  }

  /**
   * Retrieve all custom templates saved by user in local storage
   */
  public getLocalCustomTemplates(): UniversalTemplateSchema[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or update a custom template in local storage
   */
  public saveCustomTemplate(schema: UniversalTemplateSchema): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const currentList = this.getLocalCustomTemplates();
      const updatedSchema: UniversalTemplateSchema = {
        ...schema,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const filtered = currentList.filter((item) => item.id !== schema.id);
      filtered.unshift(updatedSchema);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      this.register(updatedSchema);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a custom template from local storage
   */
  public deleteCustomTemplate(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const currentList = this.getLocalCustomTemplates();
      const updated = currentList.filter((t) => t.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      this.memoryCache.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Duplicate a template into a new custom template
   */
  public duplicateTemplate(source: UniversalTemplateSchema): UniversalTemplateSchema {
    const newId = `template_${Date.now()}`;
    const copy: UniversalTemplateSchema = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Bản sao)`,
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.saveCustomTemplate(copy);
    return copy;
  }

  /**
   * Dynamically fetch a template schema by its ID.
   * Resolves in order:
   * 1. Memory cache
   * 2. Local storage custom templates
   * 3. Server API route (/api/templates/[id])
   * 4. Static JSON file (/templates/[id].json)
   */
  public async loadTemplate(id: string): Promise<UniversalTemplateSchema | null> {
    // 1. Check memory cache
    if (this.memoryCache.has(id)) {
      return JSON.parse(JSON.stringify(this.memoryCache.get(id)));
    }

    // 2. Check local storage
    const customList = this.getLocalCustomTemplates();
    const foundCustom = customList.find((t) => t.id === id);
    if (foundCustom) {
      this.register(foundCustom);
      return JSON.parse(JSON.stringify(foundCustom));
    }

    // 3. Fetch from Server API
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/templates/${encodeURIComponent(id)}`);
        if (res.ok) {
          const json = await res.text();
          const { success, schema } = deserializeTemplatePackage(json);
          if (success && schema) {
            this.register(schema);
            return schema;
          }
        }
      } catch (e) {
        console.warn(`[TemplateRegistry] API fetch failed for ${id}, trying static file...`);
      }

      // 4. Try static public file
      try {
        const staticRes = await fetch(`/templates/${encodeURIComponent(id)}.json`);
        if (staticRes.ok) {
          const json = await staticRes.text();
          const { success, schema } = deserializeTemplatePackage(json);
          if (success && schema) {
            this.register(schema);
            return schema;
          }
        }
      } catch (e) {
        console.warn(`[TemplateRegistry] Static file fetch failed for ${id}`);
      }
    }

    return null;
  }

  /**
   * Fetch manifests for all available templates (system templates + custom local templates)
   */
  public async getAllManifests(): Promise<TemplateManifest[]> {
    const manifests: TemplateManifest[] = [];
    const seenIds = new Set<string>();

    // 1. Add custom templates
    const custom = this.getLocalCustomTemplates();
    for (const tmpl of custom) {
      manifests.push(extractTemplateManifest(tmpl, true));
      seenIds.add(tmpl.id);
    }

    // 2. Fetch system template manifests from API
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const remoteManifests: TemplateManifest[] = await res.json();
          for (const rm of remoteManifests) {
            if (!seenIds.has(rm.id)) {
              manifests.push(rm);
              seenIds.add(rm.id);
            }
          }
        }
      } catch (e) {
        console.warn('[TemplateRegistry] Failed to fetch remote template manifests');
      }
    }

    return manifests;
  }
}

export const templateRegistry = new TemplateRegistry();
