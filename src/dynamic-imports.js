export async function loadFeature(featureName) {
    try {
        const module = await import(`./features/${featureName}.js`);
        return module.default || module;
    } catch (error) {
        console.error(`Failed to load feature: ${featureName}`, error);
        return null;
    }
}

export async function loadComponent(componentName) {
    try {
        const module = await import(`./components/${componentName}.js`);
        return module.default || module;
    } catch (error) {
        console.error(`Failed to load component: ${componentName}`, error);
        return null;
    }
}

export async function loadUtils(utilName) {
    try {
        const module = await import(`./utils/${utilName}.js`);
        return module.default || module;
    } catch (error) {
        console.error(`Failed to load util: ${utilName}`, error);
        return null;
    }
}

export const DynamicLoader = {
    loadFeature,
    loadComponent,
    loadUtils
};

export default DynamicLoader; 