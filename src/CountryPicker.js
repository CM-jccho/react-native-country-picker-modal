import React, { Component } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Text,
  Platform,
  FlatList,
} from 'react-native';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchBar from 'react-native-searchbar';
import cca2List from '../data/cca2';
import { getHeightPercent } from './ratio';
import CloseButton from './CloseButton';
import styles from './CountryPicker.style';
import AlphabetPicker from './AlphabetPicker';

let countries = null;
let Emoji = null;
let currentText = null;

// Maybe someday android get all flags emoji
// but for now just ios
// const isEmojiable = Platform.OS === 'ios' ||
// (Platform.OS === 'android' && Platform.Version >= 21);
const isEmojiable = Platform.OS === 'ios';

if (isEmojiable) {
  countries = require('../data/countries-emoji');
  Emoji = require('react-native-emoji').default;
} else {
  countries = require('../data/countries');

  Emoji = <View />;
}

export default class CountryPicker extends Component {
  static propTypes = {
    cca2: React.PropTypes.string.isRequired,
    phoneSelector: React.PropTypes.bool,
    showLetters: React.PropTypes.bool,
    translation: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    closeable: React.PropTypes.bool,
    children: React.PropTypes.node,
    requiredCountries: React.PropTypes.array,
    searchable: React.PropTypes.bool,
  };

  static defaultProps = {
    translation: 'eng',
  };

  state = {
    modalVisible: false,
    data: cca2List,
    letters: this.getLetters(cca2List),
    countriesFlat: this.convertCountriesToArray(),
    loading: false,
  };

  componentWillMount() {
    if (_.isArray(this.props.requiredCountries) && !_.isEmpty(this.props.requiredCountries)) {
      this.updateStateWithCountries(this.props.requiredCountries);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.requiredCountries &&
      this.props.requiredCountries &&
      nextProps.requiredCountries.length !== this.props.requiredCountries.length
    ) {
      this.updateStateWithCountries(nextProps.requiredCountries);
      if (this.props.searchable && this.searchBar) {
        this.searchBar.show();
      }
    }
  }

  onSelectCountry(cca2) {
    this.setState({
      modalVisible: false,
    });

    if (this.props.searchable && this.searchBar) {
      this.searchBar._clearInput();
    }

    this.props.onChange({
      cca2,
      ...countries[cca2],
      flag: undefined,
      name: this.getCountryName(countries[cca2]),
    });
  }

  getLetters(data) {
    return _(data)
      .map((x, i) => ({
        key: this.getCountryName(countries[x])[0],
        index: i
      }))
      .sortBy(x => x.key)
      .uniqBy(x => x.key)
      .value();
  }

  getCountryName(country, optionalTranslation) {
    const translation = optionalTranslation || this.props.translation || 'eng';
    return country.name[translation] || country.name.common;
  }

  setVisibleListHeight(offset) {
    this.visibleListHeight = getHeightPercent(100) - offset;
  }

  openModal = this.openModal.bind(this);
  // letters = _.range('A'.charCodeAt(0), 'Z'.charCodeAt(0) + 1).map(n =>
  //   String.fromCharCode(n).substr(0)
  // );

  // dimensions of country list and window
  itemHeight = 52; // getHeightPercent(7);
  listHeight = countries.length * this.itemHeight;

  openModal() {
    this.setState({ modalVisible: true });
  }

  scrollTo(index) {
    this._flatList.scrollToIndex({
      index,
      viewPosition: 0
    });
  }

  renderCountry(country, index) {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => this.onSelectCountry(country)}
        activeOpacity={0.95}
      >
        {this.renderCountryDetail(country)}
      </TouchableOpacity>
    );
  }

  renderLetters(letterObj) {
    return (
      <TouchableOpacity
        key={letterObj.key}
        onPress={() => this.scrollTo(letterObj.index)}
        activeOpacity={0.6}
      >
        <View style={styles.letter}>
          <Text style={styles.letterText}>{letterObj.key}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  renderCountryDetail(cca2) {
    const country = countries[cca2];
    return (
      <View style={styles.itemCountry}>
        {this.renderFlag(cca2)}
        <View style={styles.itemCountryName}>
          <Text style={styles.countryName}>
            {this.getCountryName(country)}
          </Text>
        </View>
      </View>
    );
  }

  renderEmojiFlag(cca2, emojiStyle) {
    let name = countries[cca2] ? countries[cca2].flag : '';
    return (
      <Text style={[styles.emojiFlag, emojiStyle]}>
        <Emoji name={name} />
      </Text>
    );
  }

  static renderImageFlag(cca2, imageStyle) {
    let source = countries[cca2] ? countries[cca2].flag : '';
    return (
      <Image
        style={[styles.imgStyle, imageStyle]}
        source={{ uri: source }}
      />
    );
  }

  renderFlag(cca2, itemStyle, emojiStyle, imageStyle) {
    return (
      <View style={[styles.itemCountryFlag, itemStyle]}>
        {isEmojiable
          ? this.renderEmojiFlag(cca2, emojiStyle)
          : CountryPicker.renderImageFlag(cca2, imageStyle)}
      </View>
    );
  }

  renderSelector(cca2, optionalTransalation) {
    if (!cca2) {
      cca2 = 'ZA'; // this is added to render the component;
    }
    const transalation =
      optionalTransalation || this.translation || 'eng';
    const country_name =
      countries[cca2].name[transalation] || countries[cca2].name.common;
    return (
      <View style={styles.selectorControl}>
        {this.renderFlag(
          cca2,
          styles.selectorCountryFlag,
          '',
          styles.selectorCountryFlagImage
        )}
        <View style={styles.selectorCountryName}>
          <Text style={styles.selectorCountryNameText}>
            {country_name}
          </Text>
        </View>
        <Image
          source={require('./dropdownArrow.png')}
          style={styles.selectorArrow}
        />
      </View>
    );
  }

  renderEmptySelector() {
    return (
      <View style={styles.selectorControl}>
        <View style={styles.selectorEmptyFlag}>
          <Ionicons name={'md-flag'} size={16} color={'#1dc4bd'} />
        </View>
        <View style={styles.selectorCountryName}>
          <Text style={styles.selectorCountryNameText}>
            {'Select a country'}
          </Text>
        </View>
        <Image
          source={require('./dropdownArrow.png')}
          style={styles.selectorArrow}
        />
      </View>
    )
  }

  renderPhoneSelector(cca2, optionalTransalation) {
    if (!cca2) {
      cca2 = 'ZA'; // this is added to render the component;
    }
    const countryCode = countries[cca2].callingCode;
    return (
      <View style={styles.phoneSelector}>
        <View style={styles.phoneSelectorFlag}>
          {CountryPicker.renderImageFlag(cca2)}
        </View>
        <View style={styles.phoneSelectorText}>
          <Text style={styles.selectorCountryNameText}>
            {`+ ${countryCode}`}
          </Text>
        </View>
      </View>
    );
  }

  convertCountriesToArray() {
    const countriesFlat = [];
    _.mapKeys(countries, (value, key) => {
      const country = {};
      country.cca2 = key;
      country.name = this.getCountryName(value, this.props.transalation);
      // country.currency = value.currency;
      // country.callingCode = value.callingCode;
      countriesFlat.push(country);
    });
    return countriesFlat;
  }

  updateCountriesOnSearch = searchResults => {
    if (_.isEmpty(searchResults)) {
      return this.updateStateWithCountries();
    }
    let items = _.map(searchResults, 'cca2');
    items = _.compact(items);
    if (items) {
      this.updateStateWithCountries(items);
    }
  }

  getHeightForLetters() {
    return getHeightPercent(100);
  }

  updateStateWithCountries(requiredCountries) {
    this.setState({ loading: true });
    if (_.isArray(requiredCountries) && !_.isEmpty(requiredCountries)) {
      let items = requiredCountries;
      if (items) {
        items = _.filter(requiredCountries, x => _.has(countries, x));
        items = _.sortBy(items, cca2 => {
          return _.get(countries[cca2], 'name.common');
        });
        this.setState({
          data: items,
          letters: this.getLetters(items),
          loading: false
        });
      }
    } else {
      this.setState({
        data: cca2List,
        letters: this.getLetters(cca2List),
        loading: false
      });
    }
  }

  handleSearch = input => {
    if (_.isEmpty(input)) return this.updateCountriesOnSearch();

    let regex = new RegExp(`${input}`, `gi`)
    let result = _.filter(this.state.countriesFlat, el => regex.test(el.name));

    this.updateCountriesOnSearch(result);

    return result;
  }

  render() {
    if (!this.props.cca2 && !this.state.modalVisible) {
      return (
        <TouchableOpacity
          onPress={() => this.setState({ modalVisible: true })}
          activeOpacity={0.7}
        >
          {this.renderEmptySelector()}
        </TouchableOpacity>
      );
    }
    return (
      <View>
        <TouchableOpacity
          onPress={() => this.setState({ modalVisible: true })}
          activeOpacity={0.7}
        >
          {this.props.children
            ? this.props.children
            : <View style={styles.touchFlag}>
              {this.props.phoneSelector
                ? this.renderPhoneSelector(this.props.cca2)
                : this.renderSelector(this.props.cca2)}
            </View>}
        </TouchableOpacity>
        <Modal
          visible={this.state.modalVisible}
          onRequestClose={() => this.setState({ modalVisible: false })}
        >
          <View style={styles.modalContainer}>
            {this.props.closeable &&
              <CloseButton
                onPress={() => this.setState({ modalVisible: false })}
              />}
            {this.props.searchable &&
              <View style={{ height: 64 }}>
                <SearchBar
                  ref={ref => this.searchBar = ref}
                  hideBack
                  clearOnShow
                  handleSearch={this.handleSearch}
                  showOnLoad
                  focusOnLayout={false}
                  allDataOnEmptySearch
                />
              </View>}
            <FlatList
              ref={flatList => this._flatList = flatList}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps={'handled'}
              data={this.state.data}
              renderItem={({ item }) => this.renderCountry(item)}
              keyExtractor={(item, index) => item}
              getItemLayout={(data, index) => ({ length: this.itemHeight, offset: this.itemHeight * index, index })}
            />
            {this.props.showLetters &&
              <View
                style={[styles.letters, {
                  height: this.getHeightForLetters(), transform:
                  [
                    { translateY: this.props.searchable ? 64 : 0 },
                    { scale: 0.9 }
                  ]
                }]}
              >
                <AlphabetPicker alphabet={this.state.letters} onTouchLetter={(letterObj) => this.scrollTo(letterObj.index)} />
              </View>}
          </View>
        </Modal>
      </View>
    );
  }
}
