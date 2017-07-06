class RecipeTree {
  constructor() {
    this.rcpSources = [];

    // TODO use Map instead
    this.factories = {}; // { "factory_key": { name, recipes:[str], upgradeRecipe } }
    this.recipes = {}; // { "recipe_key": { inFactories, name, type, input:{items}, ?output:{items}, ?factory } }
    this.items = {}; // { "item_key": { key, recipeSources, material, ?durability, ?lore:[str], ?name, ?amount } }
  }

  addRecipeSource(rcpSrc) {
    this.rcpSources.push(rcpSrc);
    Object.assign(this.factories, rcpSrc.factories);

    Object.assign(this.recipes, rcpSrc.recipes);
    for (let factoryKey in this.factories) {
      const factory = this.factories[factoryKey];
      for (let rcpKey of factory.recipes) {
        const recipe = this.recipes[rcpKey];
        recipe.key = rcpKey;
        recipe.inFactories = recipe.inFactories || [];
        recipe.inFactories.push(factory);
      }
    }

    for (let rcpKey in rcpSrc.recipes) {
      const rcp = rcpSrc.recipes[rcpKey];
      if (rcp.type === 'UPGRADE') {
        const resultingFactory = Object.values(this.factories).find(f => f.name === rcp.factory);
        if (resultingFactory.upgradeRecipe)
          throw new Error(`upgradeRecipe already set for ${rcp.factory}: ${resultingFactory.upgradeRecipe}`);
        resultingFactory.upgradeRecipe = rcp;
      }
      for (let rcpItem of Object.values(rcp.input || {}).concat(Object.values(rcp.output || {}))) {
        // HACK "fix" inconsistency
        if (rcpItem.lore && rcpItem.lore[0].endsWith(' for a bastion'))
          rcpItem.lore[0] = rcpItem.lore[0].split(' for a bastion')[0] + ' for bastion';

        rcpItem.type = bukkitNames[rcpItem.material];

        const meta = Math.max(0, rcpItem.durability || 0); // some are -1, some are undefined
        const itemData = itemNames.find(i => i.type === rcpItem.type && i.meta === meta)
          || itemNames.find(i => i.type === rcpItem.type);
        rcpItem.niceName = itemData.name;
        if (rcpItem.durability === -1)
          rcpItem.niceName = 'Any ' + rcpItem.niceName;

        const itemKey = getItemKey(rcpItem);
        const oldItem = this.items[itemKey];
        this.items[itemKey] = Object.assign({ recipeSources: [], }, rcpItem, oldItem);
        rcpItem.recipeSources = this.items[itemKey].recipeSources;
      }
      for (let rcpItem of Object.values(rcp.output || {})) {
        rcpItem.recipeSources.push(this.recipes[rcpKey]);
      }
    }
  }

  startApp(node) {
    return new Promise(onRef => {
      ReactDOM.render(
        <App
          factories={this.factories}
          recipes={this.recipes}
          items={this.items}
          ref={r => r && onRef(r)}
        />,
        node
      );
    });
  }

  static getUrl(url) {
    return new Promise((onData, onErr) => {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function() {
        if (this.readyState === 4) {
          if (this.status >= 200 && this.status < 400) {
            onData(this.responseText);
          } else {
            onErr(this);
          }
        }
      };
      request.send();
      request = null;
    });
  }
}
