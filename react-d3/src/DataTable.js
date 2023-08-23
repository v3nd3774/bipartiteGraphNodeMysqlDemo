import React, {Component} from 'react';
import { GraphContext } from './GraphContext';

import {
  useTable,
  useFilters,
  useGlobalFilter,
  useAsyncDebounce,
  useSortBy
} from "react-table";

import matchSorter from "match-sorter";

// [Modeled after](https://stackoverflow.com/a/69785106)

class DataTable extends Component {

  static contextType = GraphContext

  constructor(props){
    super(props);
    this.state = null;
    this.initialRender = this.intialRender.bind(this)
  }

  componentDidMount() {
    const [config, _] = this.context
    this.setState(config)
  }
}

export default DataTable;
