const getItemKey = item => `${item.material}:${item.durability}:${JSON.stringify(item.lore)}:${item.name}`

const App = (function(){

  const ItemQuantitySelector = ({item, selectQuantity}) =>
    <div className='itemQuantitySelector'>
      material:{item.material} {item.name && `name:${item.name} `}
      <ul className='quantities'>
        {[1, 8, 16, 32, 48, 64, 96, 128, 256].map(num =>
          <li key={num} className='selectQuantity'
            onClick={() => {
              selectQuantity(Object.assign(
                { amount: num, },
                item,
              ));
            }}
          >
            {num}</li>
        )}
      </ul>
    </div>

  const ItemQuantityWithFactoryRecipes = ({item, obtainWithRecipeInFactory}) =>
    <div className='itemFromFactoryRecipe'>
      num:{item.amount} material:{item.material} {item.name && `name:${item.name} `}
      {item.recipeSources &&
        <ul className='obtainMethods'>
          {item.recipeSources.map(recipe => recipe.inFactories.map(factory =>
            <li key={recipe.key+factory.name} className='obtainItem' onClick={() => obtainWithRecipeInFactory(item, recipe, factory)}>
              obtain from {factory.name} with recipe {recipe.name}</li>
          ))}
        </ul>
      }
    </div>

  class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        targetItems: {}, // TODO use an immutable Map
        targetFactories: [], // TODO use an immutable Set
      };
    }

    selectItemQuantity(numItem) {
      this.setState({ targetItems: { [getItemKey(numItem)]: numItem, }, });
    }

    obtainWithRecipeInFactory(item, recipe, factory) {
      const targetItems = Object.assign({}, this.state.targetItems);
      // run recipe once
      for (let rcpItem of Object.values(recipe.input || {})) {
        this.addTargetItem(rcpItem);
      }
      for (let rcpItem of Object.values(recipe.output || {})) {
        this.removeTargetItem(rcpItem);
      }

      const newState = Object.assign({}, this.state, { targetItems });
      if (!this.state.targetFactories.find(f => f.name === factory.name)) {
        newState.targetFactories = newState.targetFactories.slice();
        newState.targetFactories.push(factory);
      }

      this.setState(this.state);
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
          <div style={{fontWeight: 'bold', fontSize: '1.5em'}}>RecipeTree</div>
          <div style={{opacity: .7}}>Calculate resources required to run a FactoryMod recipe</div>
          <h2>Select the number of items you want to obtain:</h2>
          {Object.values(this.props.items).slice().sort((i,j) => i.material > j.material).map(item =>
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
        <ul className='factoryList'>
          {this.state.targetFactories.slice().sort(/* TODO */).map(f => <li key={f.key}>{f.name}</li>)}
        </ul>

        <h2>Items required</h2>
        <div>
          <span onClick={() => this.setState({ targetFactories: [], targetItems: {}, /* XXX */ })}>Clear selection</span>
        </div>
        {Object.values(this.state.targetItems).slice().sort((i,j) => i.material > j.material).map(item =>
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
