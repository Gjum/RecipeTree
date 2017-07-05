const getItemKey = item => `${item.type}:${item.durability}:${item.lore ? item.lore[0] : ''}`

const keySort = f => (a,b) => f(a) > f(b) ? 1 : -1

const App = (function(){

  const ItemStack = ({item}) => {
    let dura = item.durability || 0;
    if (item.type === 99 || item.type === 100) dura = 0; // only have first mushroom icon
    if (dura === -1) dura = 0;
    const imgUrl = `img/${item.type}-${dura}.png`;
    return <div className='itemIcon' style={{backgroundImage:`url("${imgUrl}")`}}>
      {item.amount || '999'}
    </div>
  }

  const FactorySelector = ({factory, selectFactory}) =>
    <span className='factorySelector mcButton'
      onClick={() => selectFactory(factory)}
    >
      {factory.name}
    </span>

  const ItemQuantitySelector = ({item, selectQuantity}) =>
    <div className='itemQuantitySelector'>
      <ItemStack item={item} />
      <div className='quantities'>
        {[1, 8, 16, 32, 48, 64, 96, 128, 256].map(num =>
          <span key={num} className='selectQuantity mcButton'
            onClick={() => selectQuantity(Object.assign({}, item, { amount: num, }))}
          >
            {num}</span>
        )}
      </div>
      {item.niceName} {item.name && `name:${item.name} `} {item.lore && `lore:${item.lore} `}
    </div>

  const ItemQuantityWithFactoryRecipes = ({item, obtainWithRecipeInFactory}) =>
    <div className='itemFromFactoryRecipe'>
      <ItemStack item={item} />
      {item.niceName} {item.name && `name:${item.name} `} {item.lore && `lore:${item.lore} `}
      {item.recipeSources &&
        <div className='obtainMethods'>
          {item.recipeSources.map(recipe => recipe.inFactories.map(factory =>
            <span key={recipe.key+factory.name} className='obtainItem mcButton'
              onClick={() => obtainWithRecipeInFactory(item, recipe, factory)}
            >
              obtain from {factory.name} with recipe {recipe.name}</span>
          ))}
        </div>
      }
    </div>

  class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        targetItems: {}, // TODO use an immutable Map
        targetFactories: [], // TODO use an immutable Set
        haveFactories: [], // TODO use an immutable Set
      };
    }

    selectFactory(factory) {
      const recipe = Object.values(this.props.recipes).find(r => r.factory === factory.name);
      for (let rcpItem of Object.values(recipe.input || {})) {
        this.addTargetItem(rcpItem);
      }
      if (!this.state.haveFactories.find(f => f.name === factory.name)) {
        this.state.haveFactories.push(factory);
      }
      this.setState(this.state);
    }

    selectItemQuantity(numItem) {
      this.setState({ targetItems: { [getItemKey(numItem)]: numItem, }, });
    }

    obtainWithRecipeInFactory(item, recipe, factory) {
      // run recipe once
      for (let rcpItem of Object.values(recipe.input || {})) {
        this.addTargetItem(rcpItem);
      }
      for (let rcpItem of Object.values(recipe.output || {})) {
        this.removeTargetItem(rcpItem);
      }

      const newState = this.state;
      if (!this.state.targetFactories.find(f => f.name === factory.name)) {
        newState.targetFactories = newState.targetFactories.slice();
        newState.targetFactories.push(factory);
      }

      this.setState(newState);
    }

    addTargetItem(numItem) {
      const newItem = Object.assign({}, numItem);
      const targetItems = Object.assign({}, this.state.targetItems, { [getItemKey(newItem)]: newItem });
      const oldItem = this.state.targetItems[getItemKey(newItem)];
      if (oldItem) {
        newItem.amount += oldItem.amount;
      }
      this.state.targetItems = targetItems;
    }

    removeTargetItem(numItem) {
      const targetItems = Object.assign({}, this.state.targetItems);
      const newItem = Object.assign({}, targetItems[getItemKey(numItem)]);
      newItem.amount -= numItem.amount;
      if (newItem.amount <= 0) {
        delete targetItems[getItemKey(newItem)];
      } else {
        targetItems[getItemKey(newItem)] = newItem;
      }
      this.state.targetItems = targetItems;
    }

    render() {
      if (!Object.keys(this.state.targetItems).length) {
        return <div>
          <img src="favicon.png" style={{float: 'left', marginRight: 8, height: '3em'}}/>
          <div style={{fontWeight: 'bold', fontSize: '1.5em'}}>RecipeTree</div>
          <div style={{opacity: .7}}>Calculate resources required to run a FactoryMod recipe</div>
          <h2>Select what you want to obtain:</h2>
          {Object.values(this.props.factories).slice().sort(keySort(f => f.name)).map(factory =>
            <FactorySelector
              factory={factory}
              selectFactory={factory => this.selectFactory(factory)}
              key={factory.name}
            />
          )}
          {Object.values(this.props.items).slice().sort(keySort(i => i.niceName)).map(item =>
            <ItemQuantitySelector
              item={item}
              selectQuantity={numItem => this.selectItemQuantity(numItem)}
              key={getItemKey(item)}
            />
          )}
        </div>
      }
      return <div>
        Factories required:
        <div className='factoryList'>
          {this.state.targetFactories.slice().sort(keySort(f => f.name)).map(f =>
            <span key={f.name}>{f.name}</span>
          )}
        </div>

        <h2>Items required</h2>
        {Object.values(this.state.targetItems).slice().sort(keySort(i => i.niceName)).map(item =>
          <ItemQuantityWithFactoryRecipes
            item={item}
            obtainWithRecipeInFactory={this.obtainWithRecipeInFactory.bind(this)}
            key={getItemKey(item)}
          />
        )}
      </div>
    }
  }

  return App;
})()
