const getItemKey = item => `${item.type}:${item.durability}:${item.lore ? item.lore[0] : ''}`

const keySort = f => (a,b) => f(a) > f(b) ? 1 : -1

const App = (function(){

  const ItemStack = ({item, onClick}) => {
    let dura = item.durability || 0;
    if (item.type === 99 || item.type === 100) dura = 0; // only have first mushroom icon
    if (dura === -1) dura = 0;
    const imgUrl = `img/${item.type}-${dura}.png`;
    return <div
      style={{backgroundImage:`url("${imgUrl}")`}}
      className={'itemIcon' + (onClick ? ' clickableItem' : '')}
      onClick={onClick}
    >
      {item.amount || '999'}
    </div>
  }

  const FactorySelector = ({factory, selectFactory}) =>
    <span className='factorySelector mcButton'
      onClick={() => selectFactory(factory)}
    >
      {factory.name}
    </span>

  const VerboseItemStack = ({item}) =>
    <span className='itemStackWithInfo'>
      <ItemStack item={item} />
      {' '}
      {item.niceName || item.material}
      {item.name && <span className='itemCustomName'> {item.name}</span>}
      {item.lore && <span className='itemCustomLore'> {item.lore}</span>}
    </span>

  const ItemQuantitySelector = ({item, selectQuantity}) =>
    <div className='itemQuantitySelector'>
      <span className='quantities'>
        {[1, 8, 16, 32, 48, 64, 96, 128, 256].map(num => Object.assign({}, item, { amount: num, }))
        .map(item =>
          <ItemStack key={item.amount}
            item={item}
            onClick={() => selectQuantity(item)}
          />
        )}
      </span>
      {' '}
      {item.niceName || item.material}
      {item.name && <span className='itemCustomName'> {item.name}</span>}
      {item.lore && <span className='itemCustomLore'> {item.lore}</span>}
    </div>

  const ItemQuantityWithFactoryRecipes = ({item, obtainWithRecipeInFactory}) =>
    <div className='itemFromFactoryRecipe'>
      <VerboseItemStack item={item} />
      {item.recipeSources &&
        <span className='obtainMethods'>
          {item.recipeSources.map(recipe => recipe.inFactories.map(factory =>
            <span key={recipe.key+factory.name} className='obtainItem mcButton'
              onClick={() => obtainWithRecipeInFactory(item, recipe, factory)}
            >
              {' '}
              run <span className='recipeName'>{recipe.name}</span>
              {' '}
              in <span className='factoryName'>{factory.name}</span>
            </span>
          ))}
        </span>
      }
    </div>

  class App extends React.Component {
    constructor(props) {
      super(props);
      this.resetState();
    }

    resetState() {
      return this.state = {
        itemsToAcquire: {}, // TODO use an immutable Map
        factoriesToAcquire: [], // TODO use an immutable Set
        obtainedItems: {}, // TODO use an immutable Map
        obtainedFactories: [], // TODO use an immutable Set
      };
    }

    // adds upgrade materials to itemsToAcquire,
    // adds factory to obtainedFactories,
    // removes factory from factoriesToAcquire.
    makeFactory(factory) {
      const recipe = Object.values(this.props.recipes).find(r => r.factory === factory.name);
      for (let rcpItem of Object.values(recipe.input || {})) {
        this.state.itemsToAcquire = addItemToContainer(rcpItem, this.state.itemsToAcquire);
      }
      if (!this.state.obtainedFactories.find(f => f.name === factory.name)) {
        this.state.obtainedFactories.push(factory);
      }
      this.state.factoriesToAcquire = this.state.factoriesToAcquire.filter(f => f.name !== factory.name);
      this.setState(this.state);
    }

    addItemQuantity(numItem) {
      this.state.itemsToAcquire = addItemToContainer(numItem, this.state.itemsToAcquire);
      this.state.obtainedItems = addItemToContainer(numItem, this.state.obtainedItems);
      this.setState(this.state);
    }

    obtainWithRecipeInFactory(item, recipe, factory) {
      // run recipe once
      for (let rcpItem of Object.values(recipe.input || {})) {
        this.state.itemsToAcquire = addItemToContainer(rcpItem, this.state.itemsToAcquire);
      }
      for (let rcpItem of Object.values(recipe.output || {})) {
        const inItem = this.state.itemsToAcquire[getItemKey(rcpItem)]
        const excessProduced = rcpItem.amount - (inItem ? inItem.amount : 0);
        if (excessProduced > 0) {
          // more items were produced than we wanted, add the excess to obtainedItems
          const excessItem = Object.assign({}, rcpItem, { amount: excessProduced, });
          this.state.obtainedItems = addItemToContainer(excessItem, this.state.obtainedItems);
        }
        this.state.itemsToAcquire = removeItemFromContainer(rcpItem, this.state.itemsToAcquire);
      }

      const haveFactory = this.state.obtainedFactories.find(f => f.name === factory.name);
      const isTargetFactory = this.state.factoriesToAcquire.find(f => f.name === factory.name);
      if (!haveFactory && !isTargetFactory) {
        this.state.factoriesToAcquire.push(factory);
      }

      this.setState(this.state);
    }

    render() {
      return <div>
        <img src="favicon.png" style={{float: 'left', marginRight: 8, height: '3em'}}/>
        <div style={{fontWeight: 'bold', fontSize: '1.5em'}}>RecipeTree</div>
        <div style={{opacity: .7}}>Calculate the resources required to run FactoryMod recipes</div>


        <div className={'calculator ' + (Object.keys(this.state.itemsToAcquire).length ? 'calculatorUsed' : 'calculatorUnused')}>
          <div className='toolbar'>
            <span className='mcButton' onClick={() => this.setState(this.resetState())}>
              Reset</span>
          </div>

          <div className="itemsObtained">
            Items obtained:
            <div className="itemsObtainedList">
              {Object.values(this.state.obtainedItems).slice().sort(keySort(i => i.niceName)).map(item =>
                <VerboseItemStack key={getItemKey(item)} item={item} />
              )}
            </div>
          </div>

          <div className="factoriesObtained">
            Factories obtained:
            <div className="factoriesObtainedList">
              {this.state.obtainedFactories.slice().sort(keySort(f => f.name)).map(factory =>
                <span key={factory.name} className='factoryName'> {factory.name}</span>
              )}
            </div>
          </div>

          <div className="factoriesRequired">
            Factories required:
            <div className="factoriesRequiredList">
              {this.state.factoriesToAcquire.slice().sort(keySort(f => f.name)).map(factory =>
                <span key={factory.name} className='mcButton' key={factory.name}
                  onClick={() => this.makeFactory(factory)}
                >{factory.name}</span>
              )}
            </div>
          </div>

          <h2>Items required</h2>
          <div className="itemsRequiredList">
            {Object.values(this.state.itemsToAcquire).slice().sort(keySort(i => i.niceName)).map(item =>
              <ItemQuantityWithFactoryRecipes
                item={item}
                obtainWithRecipeInFactory={this.obtainWithRecipeInFactory.bind(this)}
                key={getItemKey(item)}
              />
            )}
          </div>

          <hr style={{marginTop: '2em'}} />
        </div>

        <div className="selector">
          <h2>Select what you want to obtain:</h2>
          <div className="factorySelector">
            {Object.values(this.props.factories).slice().sort(keySort(f => f.name)).map(factory =>
              <FactorySelector
                factory={factory}
                selectFactory={factory => this.makeFactory(factory)}
                key={factory.name}
              />
            )}
          </div>
          <div className="itemSelector">
            {Object.values(this.props.items).filter(i => i.recipeSources.length).sort(keySort(i => i.niceName)).map(item =>
              <ItemQuantitySelector
                item={item}
                selectQuantity={numItem => this.addItemQuantity(numItem)}
                key={getItemKey(item)}
              />
            )}
          </div>
        </div>

      </div>
    }
  }

  function addItemToContainer(numItem, container) {
    const newItem = Object.assign({}, numItem);
    const newContainer = Object.assign({}, container, { [getItemKey(newItem)]: newItem });
    const oldItem = container[getItemKey(newItem)];
    if (oldItem) {
      newItem.amount += oldItem.amount;
    }
    return newContainer;
  }

  function removeItemFromContainer(numItem, container) {
    const newContainer = Object.assign({}, container);
    const newItem = Object.assign({}, newContainer[getItemKey(numItem)]);
    newItem.amount -= numItem.amount;
    if (newItem.amount <= 0) {
      delete newContainer[getItemKey(newItem)];
    } else {
      newContainer[getItemKey(newItem)] = newItem;
    }
    return newContainer;
  }

  return App;
})()
