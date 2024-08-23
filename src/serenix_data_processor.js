if (typeof globalNS === 'undefined') {
	globalNS = typeof window !== 'undefined' ? window :
		typeof global !== 'undefined' ? global :
			typeof self !== 'undefined' ? self : this;
}

if (typeof inBrowser === 'undefined') {
	globalNS.inBrowser = typeof window !== 'undefined';
}
if (typeof toType === 'undefined') {
	globalNS.toType = (function() {
		var classTypes = {};
		"Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ).forEach(function(name) {
			classTypes[ "[object " + name + "]" ] = name.toLowerCase();
		});

		var toString = Object.prototype.toString;

		return function toType(o) {
			if ( o == null ) {
				return o + "";
			}

			// Support: Android <=2.3 only (functionish RegExp)
			return typeof o === "object" || typeof o === "function" ?
				classTypes[ toString.call( o ) ] || "object" :
				typeof o;
		};

	})();
}

;(function(root, name, factory) {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([name], factory);
    } else {
        root[name] = factory();
    }    
})(this, 'DataProcessor', function() {

	function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

	var CSV_INJECTION_CHARS_STRING = '=|+|-|@|\t|\r|\uFF1D|\uFF0B|\uFF0D|\uFF20';
	var CSV_INJECTION_CHARS = [
		'=',
		'+',
		'-',
		'@',
		'\t',
		'\r',
		'\uFF1D', // Unicode '='
		'\uFF0B', // Unicode '+'
		'\uFF0D', // Unicode '-'
		'\uFF20', // Unicode '@'
	];
	var CSV_INJECTION_CHARS_REGEXP = new RegExp('^' + regexEscape(CSV_INJECTION_CHARS_STRING));
	/**
     * Prevents CSV injection on strings if specified by the user's provided options.
     * Mitigation will be done by ensuring that the first character doesn't being with:
     * Equals (=), Plus (+), Minus (-), At (@), Tab (0x09), Carriage return (0x0D).
     * More info: https://owasp.org/www-community/attacks/CSV_Injection
     */
    function preventCsvInjection(fieldValue) {
        if (options.preventCsvInjection) {
            if (Array.isArray(fieldValue)) {
                return fieldValue.map(preventCsvInjection);
            } else if (typeof fieldValue === 'string' && !utils.isNumber(fieldValue)) {
                return fieldValue.replace(/^[=+\-@\t\r]+/g, '');
            }
            return fieldValue;
        }
        return fieldValue;
    }

	var SERENIX_NUMBER_TYPE_INTERVALS = DataIO.SERENIX_NUMBER_TYPE_INTERVALS;

	function isDataType(str) {
		return SERENIX_NUMBER_TYPE_INTERVALS[str] || ((typeof CSVDialect !== 'undefined') && (CSVDialect !== null) ? CSVDialect.isDataType(str) : false);
	}
	/**
	 * 
	 * @abstract
	 * @class SereniX.data.DataProcessor
	 * @param {*} $ 
	 */
	function DataProcessor($) {
		DataIO.apply(this, arguments);
	}


	DataProcessor.prototype = new DataIO();

	DataProcessor.__CLASS__ = DataProcessor.prototype.__CLASS__ = DataProcessor;

	DataProcessor.__CLASS_NAME__ = DataProcessor.prototype.__CLASS_NAME__ = 'DataProcessor';

	DataProcessor.__SUPER__ = DataProcessor.__SUPER_CLASS__ = DataIO;

	DataProcessor.__AUTHOR__ = "MARC KAMGA Olivier";

	DataProcessor.isDataType = isDataType;

	function _getData(data) {
		switch (toType(data)) {
			case 'string':
				try {
					data =  JSON.parse(json = data);
				} catch (err) {
					throw new Error("Error while parsing JSON string data", err);
				}
				if (/^(object|array)$/.test(toType(data))) {
					return data;
				}
			case 'object':
			case 'array':
				return data;
		}
		throw new TypeError("String data should be an array of arrays or an array of objects");
	}
	/**
	 * When argument is an array or an object, returns the value of the argument. When the argument is a string, it's first of all parsed/converted 
	 * using JSON.parse. If the result is an array or an object, returns the converted value; otherwise, throws an exception.
	 * @name SereniX.data.DataProcessor.getData
	 * @static
	 * @param {Array|Data|string} data 
	 * @returns {Array|Data}
	 */
	DataProcessor.getData = _getData;

	DataProcessor.prototype.format = function(data) {
		throw new Error('Abstract method call');
	};

	DataProcessor.prototype.parse = function(textContent) {
		throw new Error('Abstract method call');
	};


	if (typeof SereniX.data.addChild === 'function') {
		SereniX.data.addChild(DataProcessor);
	} else {
		SereniX.data.DataProcessor = DataProcessor;
	}

	DataProcessor.preventCsvInjection = preventCsvInjection;

	DataProcessor.regexEscape = regexEscape;

	DataProcessor.CSV_INJECTION_CHARS = CSV_INJECTION_CHARS;

	DataProcessor.CSV_INJECTION_CHARS_REGEXP = CSV_INJECTION_CHARS_REGEXP;

	DataProcessor.CSV_INJECTION_CHARS_STRING = CSV_INJECTION_CHARS_STRING;

	return DataProcessor;

});


;(function(root, name, factory) {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([name], factory);
    } else {
        root[name] = factory();
    }    
})(this, 'CSVProcessor', function() {

	var regexEscape = DataProcessor.regexEscape;

	var CSV_INJECTION_CHARS = DataProcessor.CSV_INJECTION_CHARS;

	var CSV_INJECTION_CHARS_REGEXP = DataProcessor.CSV_INJECTION_CHARS_REGEXP;
	
	var CSV_INJECTION_CHARS_STRING = DataProcessor.CSV_INJECTION_CHARS_STRING;

	var _getPropDefs =  CSVDialect.getPropDefs;
	/**
	 * 
	 * @class SereniX.data.CSVProcessor
	 * @extends SereniX.data.DataProcessor
	 * @param {*} $ 
	 */
	function CSVProcessor($) {
		DataProcessor.apply(this, arguments);
		if ($ instanceof CSVDialect) {
			this.__dialect_ = $;
		} else if (isPlainObj($)) {
			this.__dialect_ = new CSVDialect($.dialect||$.dataDialect||$);
		}
	}
	
	function _getDataField(col, names, obj) {
		var i = 0, n = names.length;
		var val;
		for (; i < n; i++) {
			val = col[names[i]];
			if (val != undefined) {
				return names[i];
			}
		}
	}	

	CSVProcessor.prototype = new DataProcessor();

	CSVProcessor.__CLASS__ = CSVProcessor.prototype.__CLASS__ = CSVProcessor;

	CSVProcessor.__CLASS_NAME__ = CSVProcessor.prototype.__CLASS_NAME__ = 'CSVProcessor';

	CSVProcessor.__SUPER__ = CSVProcessor.__SUPER_CLASS__ = DataProcessor;

	CSVProcessor.__AUTHOR__ = 'MARC KAMGA Olivier';

	CSVProcessor.preventCsvInjection = DataProcessor.preventCsvInjection;

	CSVProcessor.isDataType = DataProcessor.isDataType;

	var isDataType = DataProcessor.isDataType;

	var preventCsvInjection = DataProcessor.preventCsvInjection;

	function _setColumnDataType(column, dataType) {
		if (column.dataType) {
			if ((column.dataType !== dataType) && !(new RegExp("(?:^|\\b)" + regexEscape(column.dataType) + "(?:\\b|$)").test(dataType))) {
				column.dataType += '|' + dataType;
			}
		} else if (dataType) {
			column.dataType = dataType;
		}
	}

	function normalizeArrayColumns(columns) {
		if (Array.isArray(columns)) {
			if (isPlainObj(columns[0]) && (Object.keys(columns[0]).length === 1)) {
				columns = columns.map(function(col) {
					var name;
					var keys = Object.keys(col);
					if (keys.length !== 1) {
						throw new Error('Incorrect column definition');
					}
					name = keys[0];
					return {name: name, dataType: col[name]};
				});
			} else if (Array.isArray(columns[1])) {
				columns = columns.map(function(arr) {
					if (arr.length === 2) {
						return { name: arr[0], dataType: arr[1]};
					} else if (arr.length > 2) {
						return { name: arr[0], title: arr[1], dataType: arr[2]};
					} else if (arr.length === 1) {
						return { name: arr[0], title: arr[0]}
					}
					throw new Error('Incorrect column definition');
				});
			}
		}
		return columns;
	}

	var _getData = DataProcessor.getData;
	
	/**
	 * When argument is an array or an object, returns the argument. When the argument is a string, it's first of allparsed/converted 
	 * using JSON.parse. If the result is an array or an object, returns the converted value; otherwise, throws an exception.
	 * @name SereniX.data.CSVProcessor.getData
	 * @static
	 * @param {Array|Data|string} data 
	 * @returns {Array|Data}
	 */
	CSVProcessor.getData = _getData;

	/**
	 * Transforms the given data (that is array of arrays, array of objects or json string convertible to array of arrays or array of objects) to CSV data string.
	 * @method SereniX.data.CSVProcessor.prototype.format
	 * @param {Array|Object|string} data Data or options/settings.
	 * @param {Array|Object} [columns] List of columns/fields or fields map
	 * @param {CSVDialog|Object} [dialect] Specify the CSV options to use for formatting. When not specified, this.dialect if setted is used. Otherwise, a CSV Dialect object with default settings is created and used.
	 * @param {string|number} [dataField] When columns is specified, dataField is used to get the value of column fot an item or a row.
	 * @returns {string} 
	 */
	CSVProcessor.prototype.format = function(data, columns, dialect, dataField) {
		var len = arguments.length;
		var $;
		var headers = '';
		var x;
		var output;
		var ref;
		var delim;
		var putEntries, putValues;
		var allowEntries;
		var refDelim, refOpener, refCloser, indexOpener, indexCloser;
		var expandNestedObjects, expandArrayObjects;
		var headerNames;
		var arrayValueFieldPrefix;
		var json;
		
		if (arguments.length === 1) {
			if (Array.isArray(data = _getData(data))) {
				if (Array.isArray(data[0])) {
					throw new Error('Columns expected');
				}
				dialect = this.dialect||(this.__dialect_ = new CSVDialect());
				expandNestedObjects = dialect.expandNestedObjects;
				expandArrayObjects = dialect.expandArrayObjects;
				refDelim = dialect.refDelim;
				refOpener = dialect.refOpener;
				refCloser = dialect.refCloser;
				indexOpener = dialect.indexOpener;
				indexCloser = dialect.indexCloser;
			} else {
				dialect = data.dialect||data.dataDialect||this.dialect;
				if (!dialect) {
					dialect = new CSVDialect();
				} else if (!(dialect instanceof CSVDialect)) {
					dialect = new CSVDialect(dialect);
				}
				expandNestedObjects = data.expandNestedObjects == undefined ? dialect.expandNestedObjects : data.expandNestedObjects;
				expandArrayObjects = data.expandArrayObjects == undefined ? dialect.expandArrayObjects : data.expandArrayObjects;
				dataField = coalesce(data, ['dataField', 'data.dataIndexField', 'dataRefField']);
				x = data.columns||data.cols||data.fields||data.headers||data.header
						||data.columnNames||data.colNames||data.fieldNames||data.headerNames;
				if (x)
					columns = x;

				refDelim = coalesce(data, ['refDelim', 'refDelimiter', 'pathSeparator'], dialect.refDelim);
				refOpener = coalesce(data, ['refOpener', 'pathTokenOpen'], dialect.refOpener);
				refCloser = coalesce(data, ['refCloser', 'pathTokenClose'], dialect.refCloser);
				indexOpener = coalesce(data, ['indexOpener', 'indexOpen'], dialect.indexOpener);
				indexCloser = coalesce(data, ['indexCloser', 'indexClose'], dialect.indexCloser);


				x = data.items||data.rows||data.records||data.data||data.dataset||data.dataSet
						||data.rawData||data.rowsData||data.itemsData||data.rowsSet||data.itemsSet
						||data.set;
				if (!Array.isArray(x = _getData(x))) {
					throw new Error('Incorrect arguments');
				}
				data =  x;
			}
		} else if (Array.isArray(data = _getData(data)) && (len === 2) && isPlainObj($ = columns)) {
			dialect = $.dialect||$.dataDialect||this.dialect;
			if (!dialect) {
				dialect = new CSVDialect();
			} else if (!(dialect instanceof CSVDialect)) {
				dialect = new CSVDialect(dialect);
			}
			columns = $.columns||$.cols||$.fields||$.headers||$.header
					||$.columnNames||$.colNames||$.fieldNames||$.headerNames;
			dataField = $.dataField;
			refDelim = coalesce($, ['refDelim', 'refDelimiter', 'pathSeparator'], coalesce(dialect, ['refDelim', 'refDelimiter', 'pathSeparator']));
			refOpener = coalesce($, ['refOpener', 'pathTokenOpen'], dialect.refOpener);
			refCloser = coalesce($, ['refCloser', 'pathTokenClose'], dialect.refCloser);
			indexOpener = coalesce($, ['indexOpener', 'indexOpen'], dialect.indexOpener);
			indexCloser = coalesce($, ['indexCloser', 'indexClose'], dialect.indexCloser);
		} else if (dataField instanceof CSVDialect) {
			x = dataField;
			dataField = dialect;
			dialect = x;
		} else if (isPlainObj(dataField)) {
			x = dataField;
			dataField = dialect;
			dialect = new CSVDialect(x);
		} else if (dialect && !(dialect instanceof CSVDialect)) {
			dialect = new CSVDialect(dialect);
		}
		
		dialect = dialect||this.dialect||(this.dialect = new CSVDialect());
		delim = dialect.delim||',';
		eol = dialect.lineBreak||'\n';

		columns = normalizeArrayColumns(columns);

		if (dialect.shouldWriteHeaders && columns) {
			headers = columns.map(function(col, i) {
				return col.title||col.label||col.caption||col.legend||col.name||('Col' + (i + 1));
			}).join(delim) + eol;
		}

		if (Array.isArray(data[0])) { //data is an array of arrays
			if (!columns) {
				arrayValueFieldPrefix = dialect.arrayValueFieldPrefix||'$';
				columns = [];
				headerNames = [];
				allowEntries = dialect.expandNestedObjects;
				expandArrayObjects = dialect.expandArrayObjects;
				putEntries = allowEntries ? function putEntries(csvRow, columns, headerNames, obj, key, srcColIndex) {
					function put(path, obj, srcColIndex) {
						var val;
						var _path;
						var col;
						var index;
						for (var name in obj) {
							val = obj[name];
							_path = path + refDelim + refOpener + name + refCloser;
							if ((typ = toType(val)) === 'object') {
								put(_path, val);
							} else if (typ === 'array') {
								putValues(csvRow, columns, headerNames, val, _path);
							} else {
								index = headerNames.indexOf(_path);
								if (index < 0) {
									index = headerNames.length;
									headerNames.push(_path);
									if (val == undefined) {
										col = {name: _path, dataType: '', sourceIndex: srcColIndex};
									} else {
										col = {name: _path, dataType: toType(val), sourceIndex: srcColIndex};
									}
									columns.push(col);
								} else {
									col = columns[index];
								}
								csvRow[index] = dialect.convert(val, col);
							}
						}
					}
					put(refOpener + key + refCloser, obj,srcColIndex);
				} : function putEntries(csvRow, columns, headerNames, obj, key, srcColIndex) {
					var val = JSON.stringify(obj);
					var index = headerNames.indexOf(key);
					var col;
					if (index < 0) {
						col = {name: key, index : index = headerNames.length, dataType: 'json', sourceIndex: srcColIndex};
						columns.push(col);
						headerNames.push(key);
					}
					csvRow[index] = dialect.convert(val, col);
				};
		
				var putValues = expandArrayObjects == undefined ? (expandArrayObjects = !!indexOpener) : expandArrayObjects ? function putValues(csvRow, columns, headerNames, val, srcColIndex) {
					function put(path, arr, srcColIndex) {
						var col;
						var index;
						arr.forEach(function(v, i) {
							var typ = toType(v);
							var _path = path + indexOpener + i + indexCloser;
							if (typ === 'object') {
								putEntries(csvRow, columns, headerNames, v, _path);
							} else if (typ === 'array') {
								put(_path, v);
							} else {
								typ = v instanceof Date ? 'datetime' : v == undefined ? '' : typ;
								index = headerNames.indexOf(_path);
								if (index < 0) {
									col = {name: _path, index: index = headerNames.length, dataType: typ, sourceIndex: srcColIndex};
									columns.push(col);
									headerNames.push(_path);
								} else if (typ) {
									_setColumnDataType(col = columns[index], typ);
								}
								csvRow[index] = dialect.convert(v, col);
							}
						});
					}
					put(arrayValueFieldPrefix + srcColIndex, val, srcColIndex);
				} : function putValues(csvRow, columns, headerNames, arr, key, srcColIndex) {
					var val = JSON.stringify(arr);
					var index = headerNames.indexOf(key);
					var col;
					if (index < 0) {
						col = {name: key, index : index = headerNames.length, dataType: 'json', sourceIndex: srcColIndex};
						columns.push(col);
						headerNames.push(key);
					}
					csvRow[index] = dialect.convert(val, col);
				};
				if (allowEntries || expandArrayObjects) {
					output = data.map(function(item) {
						var csvRow = [];
						var c, n;
						var key;
						var val;
						var col;
						var colIndex;
						var dataType;
						for (c = 0, n = item.length; i < n; i++) {
							key = arrayValueFieldPrefix + srcColIndex;
							val = item[c];
							dataType = val != undefined ? val instanceof Date ? 'datetime' : toType(val) : '';
							if ((dataType === 'object') && allowEntries) {
								putEntries(csvRow, columns, headerNames, val, key, c);
								continue;
							} else if ((dataType === 'array') && expandArrayObjects) {
								putValues(csvRow, columns, headerNames, val, key, c);
								continue;
							} else if ((colIndex = headerNames.indexOf(key)) < 0) {
								headerNames.push(key);
								columns.push(col = {
									name: key,
									dataType: dataType,
									basic: true,
									sourceIndex: c,
									index: colIndex = columns.length
								});
							} else {
								_setColumnDataType(col = columns[colIndex], dataType);
							}
							csvRow[colIndex] = dialect.convert(val, col);
						}
						return csvRow.join(delim);
					});
				} else {
					output = data.map(function(row) {
						var csvRow = [];
						row.forEach(function(val, c) {
							var column = columns[c];
							var name = arrayValueFieldPrefix + c;
							var dataType = val != undefined ? val instanceof Date ? 'datetime' : toType(val) : '';
							if (!column) {
								column = val == undefined ? {name: name, index: c} : {name: name, index: c, dataType: dataType};
								columns.push(column);
							} else if (val != undefined) {
								_setColumnDataType(column, dataType);
							}
							csvRow.push(dialect.convert(val, column));
						});
						return csvRow.join(delim);
					});
				}
			} else if ((typeof dataField === 'number') && (dataField >= 0) && (Math.floor(dataField) === dataField)) {
				output = data.map(function(row) {
					var csvRow = [];
					columns.forEach(function(column) {
						csvRow.push(dialect.convert(row[column[dataField]], column));
					});
					return csvRow.join(delim);
				});
			} else {
				output = data.map(function(row) {
					var csvRow = [];
					columns.forEach(function(column, c) {
						csvRow.push(dialect.convert(row[c], column));
					});
					return csvRow.join(delim);
				});
			}
		} else if (!columns) {
			columns = [];
			headerNames = [];
			allowEntries = expandNestedObjects == undefined ? refDelim || refOpener : expandNestedObjects;
			putEntries = allowEntries ? function putEntries(csvRow, columns, headerNames, obj, key) {
				function put(path, obj) {
					var val;
					var _path;
					var col;
					var index;
					for (var name in obj) {
						val = obj[name];
						_path = path + refDelim + refOpener + name + refCloser;
						if ((typ = toType(val)) === 'object') {
							put(_path, val);
						} else if (typ === 'array') {
							putValues(csvRow, columns, headerNames, val, _path);
						} else {
							index = headerNames.indexOf(_path);
							if (index < 0) {
								index = headerNames.length;
								headerNames.push(_path);
								if (val == undefined) {
									col = {name: _path, dataType: ''};
								} else {
									col = {name: _path, dataType: toType(val)};
								}
								columns.push(col);
							} else {
								col = columns[index];
							}
							csvRow[index] = dialect.convert(val, col);
						}
					}
				}
				put(refOpener + key + refCloser, obj);
			} : function putEntries(csvRow, columns, headerNames, obj, key) {
				var val = JSON.stringify(obj);
				var index = headerNames.indexOf(key);
				var col;
				if (index < 0) {
					col = {name: key, index : index = headerNames.length, dataType: 'json'};
					columns.push(col);
					headerNames.push(key);
				}
				csvRow[index] = dialect.convert(val, col);
			};
	
			var putValues = expandArrayObjects == undefined ? (expandArrayObjects = !!indexOpener) : expandArrayObjects ? function putValues(csvRow, columns, headerNames, val, key) {
				function put(path, arr) {
					var col;
					var index;
					arr.forEach(function(v, i) {
						var typ = toType(v);
						var _path = path + indexOpener + i + indexCloser;
						if (typ === 'object') {
							putEntries(csvRow, columns, headerNames, v, _path);
						} else if (typ === 'array') {
							put(_path, v);
						} else {
							typ = v instanceof Date ? 'datetime' : v == undefined ? '' : typ;
							index = headerNames.indexOf(_path);
							if (index < 0) {
								col = {name: _path, index: index = headerNames.length, dataType: typ};
								columns.push(col);
								headerNames.push(_path);
							} else if (typ) {
								_setColumnDataType(col = columns[index], typ);
							}
							csvRow[index] = dialect.convert(v, col);
						}
					});
				}
				put(key, val);
			} : function putValues(csvRow, columns, headerNames, arr, key) {
				var val = JSON.stringify(arr);
				var index = headerNames.indexOf(key);
				var col;
				if (index < 0) {
					col = {name: key, index : index = headerNames.length, dataType: 'json'};
					columns.push(col);
					headerNames.push(key);
				}
				csvRow[index] = dialect.convert(val, col);
			};
			if (allowEntries || expandArrayObjects) {
				output = data.map(function(item) {
					var csvRow = [];
					var key;
					var val;
					var col;
					var colIndex;
					var dataType;
					for (key in item) {
						val = item[key];
						dataType = val != undefined ? val instanceof Date ? 'datetime' : toType(val) : '';
						if ((dataType === 'object') && allowEntries) {
							putEntries(csvRow, columns, headerNames, val, key);
							continue;
						} else if ((dataType === 'array') && expandArrayObjects) {
							putValues(csvRow, columns, headerNames, val, key);
							continue;
						} else if ((colIndex = headerNames.indexOf(key)) < 0) {
							headerNames.push(key);
							columns.push(col = {
								name: key,
								dataType: dataType,
								index: colIndex = columns.length
							});
						} else {
							_setColumnDataType(col = columns[colIndex], dataType);
						}
						csvRow[colIndex] = dialect.convert(val, col);
					}
					return csvRow.join(delim);
				});
			} else {
				output = data.map(function(item) {
					var csvRow = [];
					var key;
					var val;
					var col;
					var colIndex;
					var dataType;
					for (key in item) {
						val = item[key];
						dataType = val != undefined ? val instanceof Date ? 'datetime' : toType(val) : '';
						if ((colIndex = headerNames.indexOf(key)) < 0) {
							headerNames.push(key);
							columns.push(col = {
								name: key,
								dataType: dataType,
								index: colIndex = columns.length
							});
						} else {
							_setColumnDataType(col = columns[colIndex], dataType);
						}
						csvRow[colIndex] = dialect.convert(val, col);
					}
					return csvRow.join(delim);
				});
			}
			if (dialect.shouldWriteHeaders && columns) {
				headers = columns.map(function(col, i) {
					return col.title||col.label||col.caption||col.legend||col.name||('Col' + (i + 1));
				}).join(delim) + eol;
			}
		} else {
			ref = dataField||_getDataField(columns[0], ['field', 'dataField', 'dataRef', 'name', 'ref', 'reference', 'id', 'Id', 'ID']);
			output = data.map(function(item) {
				var csvRow = [];
				columns.forEach(function(column) {
					csvRow.push(dialect.convert(item[column[ref]], column));
				});
				return csvRow.join(delim);
			});
		}
        return (dialect.withBOM ? CSVDialect.EXCEL_BOM : '') + headers + output.join(eol) + (dialect.shouldLastRecordHasLineBreak ? eol : '');
	};
	/**
	 * Transforms the given array data to CSV data string. This method is an alias of SereniX.data.CSVProcessor.prototype.format.
	 * @alias SereniX.data.CSVProcessor.prototype.format
	 * @method SereniX.data.CSVProcessor.prototype.stringify
	 * @param {Array|Object} data Data or options/settings
	 * @param {Array} [columns] 
	 * @param {Object} [dialect] 
	 * @param {string|number} [dataField] 
	 * @returns {string}
	 */
	CSVProcessor.prototype.stringify = CSVProcessor.prototype.format;

	/**
	 * Transforms the given array data to CSV data string. This method is an alias of SereniX.data.CSVProcessor.prototype.format.
	 * @alias SereniX.data.CSVProcessor.prototype.format
	 * @method SereniX.data.CSVProcessor.prototype.stringify
	 * @param {Array|Object} data Data or options/settings
	 * @param {Array} [columns] 
	 * @param {Object} [dialect] 
	 * @param {string|number} [dataField] 
	 * @returns {string}
	 */
	CSVProcessor.prototype.serialize = CSVProcessor.prototype.format;
	/**
	 * Transforms the given array data to CSV data string. This method is an alias of SereniX.data.CSVProcessor.prototype.format.
	 * @alias SereniX.data.CSVProcessor.prototype.format
	 * @method SereniX.data.CSVProcessor.prototype.stringify
	 * @param {Array|Object} data Data or options/settings
	 * @param {Array} [columns] 
	 * @param {Object} [dialect] 
	 * @param {string|number} [dataField] 
	 * @returns {string}
	 */
	CSVProcessor.prototype.toCSVString = CSVProcessor.prototype.format;

	/**
     * Removes the outermost wrap delimiters from a value, if they are present
     * Otherwise, the non-wrapped value is returned as is
     */
    function removeWrapDelimitersFromValue(strVal, quote) {
        var lastIndex = strVal.length - 1;
        // If the field starts and ends with a quote
        if (strVal[0] === quote && strVal[lastIndex] === quote) {
            // Handle the case where the field is just a pair of wrap delimiters 
            return strVal.length <= 2 ? '' : strVal.substring(1, lastIndex);
        }
        return strVal;
    }

	/**
     * Trims the header key, if specified by the user via the provided options
     */
    function processHeaderName(headerKey) {
        headerKey = removeWrapDelimitersFromValue(headerKey);
        if (options.trimHeaderFields) {
            return headerKey.split('.')
                .map((component) => component.trim())
                .join('.');
        }
        return headerKey;
    }

	function _getItemType(itemType) {
		var path = itemType.split(/\s*\.\s*/);
		var o = globalNS, c;
		var i = 0, n = path.length;
		for (; i < n; i++) {
			c = o[path[i]];
			if (c == undefined)
				return;
			o = c;
		}
		return c;
	}

	function _getFieldsFilter(opts, dialect) {	
		var fieldFilter;
		var filter = opts ? opts.fieldFilter||opts.columnFilter||opts.fieldsFilter||opts.columnsFilter||dialect.filter : dialect.filter;
		var excludedKeys = opts? opts.excludedKeys||opts.excludeKeys||dialect.excludedKeys : dialect.excludedKeys;
		if ((typeof filter === 'string') || (filter instanceof String)) {
			filter = filter.split(/\s*\|\s*/);
			if (!filter.length) {
				filter = false;
			}
		}

		if (excludedKeys instanceof RegExp) {
			fieldFilter = function(name) {
				return !re.test(name);
			};
			fieldFilter.re = excludedKeys;
		} else if (excludedKeys && excludedKeys.length) {
			fieldFilter = function filter(name) {
				return filter.excluded.indexOf(name) < 0;
			}
			fieldFilter.excluded = dialect.excludedKeys;
		} else if ((typeof filter === 'function') || (filter instanceof Function)) {
			fieldFilter = filter;
		} else if (Array.isArray(filter)) {
			fieldFilter = function filter(name) {
				return filter.excluded.indexOf(name) < 0;
			}
			fieldFilter.excluded = filter;
		} else if (filter instanceof RegExp) {
			fieldFilter = function filter(name) {
				return filter.re.test(name);
			};
			fieldFilter.re = filter;
		} else if (isPlainObj(filter)) {
			if ((typeof filter.accept === 'function') || (filter.accept instanceof Function)) {
				fieldFilter = function filter(name) {
					return filter.predicate.accept(name);
				};
				fieldFilter.predicate = filter;
			} else if ((typeof filter.filter === 'function') || (filter.filter instanceof Function)) {
				fieldFilter = function filter(name) {
					return filter.predicate.filter(name);
				};
				fieldFilter.predicate = filter;
			} else {
				var exclusion = coalesce(filter, [
					'exclusions', 'exclusion', 'excluded', 'excludes', 
					'exclude', 'excludedFields', 'excludeFields', 
					'reject', 'rejectedFields', 'rejectFields',
					'not', 'negation', 'negate'])
				var fields = coalesce(filter, ['fields', 'columns']);
				if (Array.isArray(exclusion)) {
					fieldFilter = function filter(name) {
						return filter.excluded.indexOf(name) < 0;
					};
					fieldFilter.excluded = exclusion.map(function(ex) {
						if (typeof ex === 'string')
							return ex;
						if (isPlainObj(ex)) {
							return ex.name;
						}
						if (Array.isArray(ex)) {
							return ex[0];
						}
						throw new Error('Incorrect exclusion specification');
					});
				} else if ((typeof exclusion === 'string') || (exclusion instanceof String)) {
					exclusion = exclusion.split(/\s*\|\s*/);
					if (exclusion.length ===  1) {
						if (!exclusion[0]) {
							fieldFilter = false;
						} else {
							fieldFilter = function filter(col) {
								return filter.excluded.indexOf(col.name) < 0;
							};
							fieldFilter.excluded = exclusion;
						}
					}
				}  else if ((typeof exclusion === 'boolean') || (exclusion instanceof Boolean)) {

				} else if (Array.isArray(fields)) {

				} else if ((typeof fields === 'string') || (fields instanceof String)) {

				}  else if (isPlainObj(fields)) {

				} else {
					throw new Error('Field field not yet supported');
				}
			}
		}
		
		return fieldFilter;
	}

	CSVProcessor.prototype.parse = function(textContent, opts, $) {
		var headerRow;
		function _getArrayMapFields(map) {
			if (Array.isArray(map[0])) {
				return headerRow.map(function(name, index) {
					var entry = _getEntry(map, name);
					var fld = {
						name: processHeaderName(name),
						index: index
					};
					if (entry) {
						fld.dataType = entry[1];
					}
					return fld;
				});
			} else if (map.length <= headerRow.length) {
				return headerRow.map(function(name, index) {
					return {
						name: processHeaderName(name),
						dataType: map[index],
						index: index
					};
				});
			} else {
				var i = 0, n = Math.floor(map.length/2);
				var fields = [];
				var fld;
				var index;
				for (; i < n; i++) {
					fld = map[2*i];
					index = headerRow.indexOf(fld);
					if (index < 0) {
						throw new Error('Not header row field: ' + fld);
					}
					fields[index] = {name: fld, index: index, dataType: map[2*i + 1]};
				}
				return fields;
			}
		}
		function _getFields(hashMap) {
			var typ;
			return headerRow.map(function(name, index) {
				var val = hashMap[name];
				fld = {
					name: processHeaderName(name),
					index
				};
				if (val) {
					if (typeof val === 'string') {
						fld.dataType = val;
					} else if (typeof val === 'object') {
						if (typ = val.dataType||val.datatype||val.type) {
							fld.dataType = typ;
						}
					}
				}
				return fld;
			});
		}

		function _setFieldsMap(fieldsMap, headerRow) {
			function _get(name) {
				var i = 0, n = fieldsMap.length;
				for (; i < n; i++) {
					if (fieldsMap[i].name === name) {
						return fieldsMap[i];
					}
				}
			}
			return headerRow.map(function(name) {
				var field;
				var def = _get(name);
				if (def) {
					field = {};
					for (var key in def) {
						field[key] = def[key];
					}
					return field;
				}
				return {name: name};
			});
		}
		
		function processHeaders() {
			var keys;
			var k;
			var x;
			// Generate and return the heading keys
			headerRow = readHeadRow();
			if (Array.isArray(fields)) {
				if (fields.length === headerRow.length) {
					if (((keys = Object.keys(fields[0])).length ===  1) 
						&& (typeof (x = fields[0][k = keys[0]]) === 'string')) {
						//if (/name|title|label|legend|caption|field|ref/.test(k) ? isDataType(x)  : true)) {
						if (isDataType(x)) {
							return fields.map(function(field, i) {
								k = Object.keys(field)[0];
								return {name: headerRow[i], index: i, dataType: field[k]};
							});
						} else {
							return fields.map(function(field, i) {
								k = Object.keys(field)[0];
								return {name: headerRow[i], index: i, title: field[k]};
							});
						}
					}
					return fields.map(function(field, i) {
						var title;
						var fld;
						var name;
						if (field.name) {
							fld = {name: field.name, index: i};
							if (field.name === headerRow[i]) {
								fld.title = field.title||field.caption||field.label||field.legend||field.name;
							} else if ((title = field.title||field.caption||field.label||field.legend)) {
								fld.title = title;
							} else {
								field.title = headerRow[i];
							}
						} else {
							title = field.title||field.caption||field.label||field.legend;
							name = field. field !=undefined ? field.field : field.id||field.Id||field.ID !=undefined ? field.id||field.Id||field.ID : title;
							fld = {
								name: name,
								title: title,
								index: i
							};
						}
						return fld;
					});
				} else {
					throw new Error('Not yet supported');
				}
			} else if (isPlainObj(fields)) {
				fields = _getFields(fields);				
			} else if (Array.isArray(fieldsMap)) {
				fields = _setFieldsMap(fieldsMap, headerRow);
			} else if (Array.isArray(fieldDataTypes)) {
				fields = _getArrayMapFields(fieldDataTypesMap);
			} else if (isPlainObj(fieldDataTypesMap)) {
				fields = _getFields(fieldDataTypesMap);
			} else if (Array.isArray(fieldDataTypesMap)) {
				fields = _getArrayMapFields(fieldDataTypesMap);
			} else {
				return headerRow.map(function(name, index) {
					return {
						name: name,
						index: index
					}
				});
			}
			return fields;
		}

		function readQuotedString() {
			var str = "";
			var j;
			var offset = ++i;
			while (i < n) {
				if (textContent.startsWith(escapedQuote, i)) {
					str += textContent.substring(offset, i) + quote;
					i += 2;
					offset = i;
				} else if (textContent[i] === quote) {
					str += textContent.substring(offset, i);
					i++;
					j = i;
					if (i < n) {
						if (textContent.startsWith(delim, i)) {
							//i += delim.length;
							//offset = i;
							console.log('Delimiter after quoted string');
						} else if (!textContent.startsWith(lineBreak, i)) {
							throw new Error('Delimiter or line break expected');
						}
					}
					return str;
				} else {
					i++;
				}
			}
			throw new Error('Unclosed quoted string');
		}
		function skipComments() {
			var pos;
			while ((i < n) && textContent.startsWith(commentSymbol, i)) {
				i += commentSymbol.length;
				if ((pos = textContent.indexOf(lineBreak, i)) < 0) {
					return;
				}
				i = pos + lineBreak.length;
			}
			return i;
		}
		function readHeadRow() {
			if (commentSymbol) {
				if (skipComments() == undefined)
					return;
			}
			row = [];
			while (i < n) {
				ch = textContent[i];
				if (textContent.startsWith(delim, i)) {
					strVal = textContent.substring(offset, i);
					row.push(strVal ? dialect.stringValue(strVal) : strVal);
					i += delim.length;
					offset = i;
				} else if (ch === quote) {
					strVal = readQuotedString();
					row.push(strVal ? dialect.stringValue(strVal, columns[row.length]) : dialect.valueOfEmptyQuotedString());
					if (textContent.startsWith(lineBreak, i)) {
						i += lineBreak.length;
						offset = i;
						return row;
					} else if (textContent.startsWith(delim, i)) {
						i += delim.length;
					}
					offset = i;
				} else if (textContent.startsWith(lineBreak, i)) {
					row.push(strVal ? dialect.stringValue(textContent.substring(offset, i)) : dialect.valueOfEmptyString());
					i += lineBreak.length;
					offset = i;
					return row;
				} else {
					i++;
				}
			}
			if (offset < n) { //if pending processed string value
				strVal = textContent.substring(offset);
				//add to headers row
				row.push(strVal ? dialect.stringValue(strVal, columns[row.length]) : dialect.valueOfEmptyString());
			}
			return row;
		}
		var dialect = this.dialect;
		var i = 0, n;
		var offset;
		var row;
		var rows = [];
		var itemType;
		var refDelim, refOpener, refCloser, indexOpener, refCloser;
		var x;
		
		var fields, fieldsMap, fieldDataTypes, fieldDataTypesMap;
		if (arguments.length === 1) {
			if (isPlainObj(textContent)) {
				opts = textContent;
				textContent = opts.textContent||opts.text||opts.rawData||opts.textData||opts.stringData||opts.string||opts.data;
			}
		} else if (isPlainObj(textContent)) {
			x = textContent;
			textContent = opts;
			opts = x;
		}

		n = textContent.length;
		if (dialect.withBOM === true) {
			i = 1;
		} else if ((typeof dialect.withBOM === 'string') && dialect.withBOM) {
			i = dialect.withBOM.length;
		} else {
			i = 0;
		}
		offset = i;
		if (dialect.shouldLastRecordHasLineBreak && (textContent.substring(textContent.length - lineBreak.length) === lineBreak)) {
			n -= lineBreak.length;
		}

		if (!n || (i >= n))
			return rows;

		if (opts instanceof CSVDialect) {
			dialect = opts;
		} else if (isPlainObj(opts)) {
			fields =  opts.fields||opts.columns||opts.cols||opts.headers||opts.header
					||opts.headerFields||opts.headerColumns||opts.headFields||opts.headerColumns
					||opts.headCols||opts.headerCols;
			dialect = dialect||opts.dialect;
			fieldsMap = opts.fieldsMap;
			fieldDataTypes = opts.fieldDataTypes;
			fieldDataTypesMap = opts.fieldDataTypeMaps;
			if (dialect) {
				if (!(dialect instanceof CSVDialect)) {
					dialect = new CSVDialect(dialect);
				}
			} else {
				dialect = new CSVDialect(opts);
			}
			refDelim = coalesce(opts, ['refDelim', 'refDelimiter', 'pathSeparator'], coalesce(dialect, ['refDelim', 'refDelimiter', 'pathSeparator']));
			refOpener = coalesce(opts, ['refOpener', 'pathTokenOpen'], dialect.refOpener);
			refCloser = coalesce(opts, ['refCloser', 'pathTokenClose'], dialect.refCloser);
			indexOpener = coalesce(opts, ['indexOpener', 'indexOpen'], dialect.indexOpener);
			indexCloser = coalesce(opts, ['indexCloser', 'indexClose'], dialect.indexCloser);
			itemType = (itemType = opts.resultItemType||opts.resultRowType||opts.resultElementType
							||opts.itemType||opts.rowType||opts.elementType||opts.resultType||'') ? 
							    (typeof itemType === 'function' ? itemType : 
								/^(item|object)s$/i.test(itemType) ? 'object' : 
								/^(array(<\s*array\s*>|s)?|records|rows)$/i.test(itemType) ? 'array' : _getItemType(itemType)) : undefined;
		} else if (Array.isArray(opts)) {
			fields = opts;
			if ($ instanceof CSVDialect) {
				dialect = $;
			} else if (isPlainObj($)) {
				fields =  $.fields||$.columns||$.cols||$.headers||$.header||$.headerFields||$.headerColumns;
				dialect = $.dataDialect||$.dialect;
				fieldDataTypes = $.fieldDataTypes;
				fieldDataTypesMap = $.fieldDataTypeMaps;
				dialect = $.dataDialect||$.dialect;
				if (!(dialect instanceof CSVDialect) && dialect) {
					dialect = new CSVDialect(dialect);
				}
			}
		}
		function tokenizeField(field) {

		}
		if (!dialect) {
			dialect = this.dialect||(new CSVDialect());
		}
		var commentSymbol = dialect.commentSymbol||'';
		var quote = dialect.quote||dialect.quoteChar;
		var quoteEscaper = dialect.quoteEscapeChar;
		var escapedQuote = quoteEscaper + quote;
		var lineBreak = dialect.lineBreak;
		var delim = dialect.delim;
		var strVal;
		var offset = i;
		var quotedColumns;

		var expandNestedObjects = dialect.expandNestedObjects;
		var expandArrayObjects = dialect.expandArrayObjects;
		var nestedDelim = dialect.nestedDelim;
		var refDelim = dialect.refDelim;
		var refOpener = dialect.refOpener;
		var refCloser = dialect.refCloser;
		var indexOpener = dialect.indexOpener;
		var indexCloser = dialect.indexCloser;

		var indexRe;
		var headers = processHeaders();
		var fieldFilter = _getFieldsFilter(opts, dialect);

		var createRow, _setFieldValue, _itemTopLevelRef;
		var col;
		var c;
		var pathSingleTokenizer;

		if (!itemType) {
			itemType = (function() {
				var i = 0, n = headerRow.length;
				var re;
				if (dialect.arrayValueFieldPrefix != undefined) {
					re = new RegExp('^' + regexEscape(dialect.arrayValueFieldPrefix) + '\d+[\.\[\{\(<\\\/].+');
					for (; i < n; i++) {
						if (re.test(headerRow[i])) {
							return 'array';
						}
					}
				}
				return 'object';
			})();
		}
		if ((itemType === 'array') || (itemType === 'Array') || (itemType === Array)) {
			createRow = function() {
				return [];
			};
			_itemTopLevelRef = function(tokens) {
				return parseInt(/\d+$/.exec(tokens[0])[0], 10)
			};
		} else if (typeof itemType === 'function') { // if itemType is a class
			createRow = function _create() {
				return new _create.Item();
			};
			createRow.Item = itemType;
			_itemTopLevelRef = function(tokens) {
				return tokens[0];
			};
		} else {
			createRow = function() {
				return {};
			};
			_itemTopLevelRef = function(tokens) {
				return tokens[0];
			};
		}

		var quoteEmptyString = dialect.__quoteEmptyStringValue_;
		//if dialect.__nullStringValue_ is undefined or null, set its value to empty string
		var nullStringValue = dialect.__nullStringValue_ == undefined ? '' : dialect.__nullStringValue_;
		//if dialect.__undefinedStringValue_ is undefined or null, set its value to empty string
		var undefinedStringValue = dialect.__undefinedStringValue_ == undefined ? '' : dialect.__undefinedStringValue_;

		var isEmptyStringAValue = dialect.__quoteAllStringValues__ || quoteEmptyString || (('' === undefinedStringValue) && ('' === nullStringValue)) ? 
					false //null value, undefined value and empty string not considered as value
				: '' !== undefinedStringValue ?  true : false;

		_setFieldValue = function (row, col, val) {
			var pathTokens = col.pathTokens;
			var i, n = pathTokens.length - 1;
			var ref = _itemTopLevelRef(pathTokens);
			var o = row;
			var x;
			if ((n > 0) && (val != undefined)) {
				for (i = 0; i < n; i++) {
					ref = pathTokens[i];
					x = o[ref];
					if (x == undefined) {
						o[ref] = x = typeof pathTokens[i + 1] === 'number' ? [] : {};
					}
					o = x;
				};
				ref = pathTokens[n];
			}
			if (o[ref] != undefined) {
				throw new Error('Incorrect CSV raw data:  too many nested values or value already setted');
			}
			o[ref] = val;
		};

		if (!refDelim && !refOpener && refCloser) {
			refDelim = refCloser;
			refCloser = "";
		}

		if (nestedDelim) {
			indexRe = new RegExp(regexEscape(nestedDelim), "g");
			if (expandNestedObjects) {
				if (expandArrayObjects) {
					headers.forEach(function(field) {
						var tokens = field.pathTokens = [];
						var name = field.name;
						var match;
						var i = indexRe.lastIndex = 0;
						while ((match = indexRe.exec(name))) {
							tokens.push(/\d+/.test(match = name.substring(i, indexRe.lastIndex - match[0].length)) ? parseInt(match, 10) : match);
							i = indexRe.lastIndex;
						}
						if (i < name.length) {
							tokens.push(/\d+/.test(match = name.substring(i)) ? parseInt(match, 10) : match);
						}
					});
				} else {
					headers.forEach(function(field) {
						var tokens = field.pathTokens = [];
						var name = field.name;
						var match;
						var i = indexRe.lastIndex = 0;
						while ((match = indexRe.exec(name))) {
							tokens.push(name.substring(i, indexRe.lastIndex - match[0].length));
							i = indexRe.lastIndex;
						}
						if (i < name.length) {
							tokens.push(name.substring(i));
						}
					});
				}
			} else if (expandArrayObjects) {
				headers.forEach(function(field) {
					var tokens = field.pathTokens = [];
					var name = field.name;
					var match;
					var i = indexRe.lastIndex = 0;
					while ((match = indexRe.exec(name))) {
						if (!/\d+/.test(match = name.substring(i, indexRe.lastIndex - match[0].length))) {
							throw new Error('Unexpected nested delimiter');
						}
						tokens.push(parseInt(match, 10));
						i = indexRe.lastIndex;
					}
					if (i < name.length) {
						if (!/\d+/.test(match = name.substring(i))) {
							throw new Error('Unexpected nested delimiter');
						}
						tokens.push(parseInt(match, 10));
					}
				});
			} else {

			}
		} else if (expandNestedObjects && refDelim) {
			if (refOpener) { //path delimiter and path enclosing defined/specified
				refOpener = regexEscape(refOpener);
				refCloser = regexEscape(refCloser||'');
				if (!pathSingleTokenizer) {//for example path token can be specified using '.' character followed by the path tokken 
											//or using encloser characteres ('[' and ']' containing path token inside)
					if (indexOpener) { // if array index opener character that specify that array index is allowed/setted
										//this case is when both nested objects and nested arrays are supported
						indexRe = new RegExp('\s*(?:' + regexEscape(indexOpener) + "([\\d]+)" + regexEscape(indexCloser) + '|(\.)|' 
							+ refOpener 
							+ "(?:\"((?:[^\"]|\\\\\")+)\"|'((?:[^']|\\\\')+)')|([^" + refOpener + regexEscape(refCloser) + "]+))" 
							+ refCloser + ')\s*');
						headerRow.forEach(function(field) {
							var match;
							var i = 0, end;
							var name = field.name;
							var tokens = field.pathTokens = [];
							var dot = false;
							while ((match = indexRe.exec())) {
								end = indexRe.lastIndex - match[0].length;
								if (i < end) {
									tokens.push(name.substring(i, end));
								} else if (dot) {
									throw new Error('Unexpected dot character');
								}
								if (match[2]) { //dot (.) match
									dot = true;
								} else {
									if (match[1]) { //array index match
										tokens.push(parseInt(match[1], 10));
									} else if (match[3]) {//double quoted path match
										tokens.push(match[3].replace(/\\"/g, '"'));
									} else if (match[4]) { //single quoted path match
										tokens.push(match[4].replace(/\\'/g, "'"));
									} else { //unquoted path match
										tokens.push(match[5]);
									}
									dot = false;
								}
								i = indexRe.lastIndex;
							}
						});
					} else { //when only nested objects supported but not nested/flatten arrays
						indexRe = new RegExp('(\.)|' 
							+ refOpener 
							+ "(?:\"((?:[^\"]|\\\\\")+)\"|'((?:[^']|\\\\')+)')|([^" + refOpener + regexEscape(refCloser) + "]+))" 
							+ refCloser);
						headerRow.forEach(function(field) {
							var match;
							var i = 0, end;
							var name = field.name;
							var tokens = field.pathTokens = [];
							var dot = false;
							while ((match = indexRe.exec())) {
								end = indexRe.lastIndex - match[0].length;
								if (i < end) {
									tokens.push(name.substring(i, end));
								} else if (dot) {
									throw new Error('Unexpected dot character');
								}
								if (match[1]) { //dot (.) match
									dot = true;
								} else {
									if (match[2]) {//double quoted path match
										tokens.push(match[2].replace(/\\"/g, '"'));
									} else if (match[3]) { //single quoted path match
										tokens.push(match[3].replace(/\\'/g, "'"));
									} else { //unquoted path match
										tokens.push(match[4]);
									}
									dot = false;
								}
								i = indexRe.lastIndex;
							}
						});
					}
					
				} else if (indexOpener) {//path token is enclosed and two contiguous path tokens are delimited
											// and array index also supported
					indexOpener = regexEscape(indexOpener);
					indexCloser = regexEscape(indexCloser);
					indexRe = refOpener + "([^" + refOpener + regexEscape(refCloser) + "]+)" + refCloser;
					if ((refOpener === indexOpener ) && (refCloser === indexCloser)) {
						indexRe = new RegExp(indexOpener + "([\\d]+)" + indexCloser + '|' + regexEscape(refDelim) + '?' + indexRe, "g");
						headerRow.forEach(function(field) {
							
						});
					} else {
						indexRe = new RegExp(indexRe + '|' + indexOpener + "([\\d]+)" + indexCloser, "y");
						headerRow.forEach(function(field) {

						});
					}
				} else { //path token is enclosed and two contiguous path tokens are delimited
							// and array index not supported
					indexRe = new RegExp(regexEscape(refCloser) + '\\s*' + regexEscape(refDelim) + '\\s*' + regexEscape(refOpener), "g");
					headerRow.forEach(function(field) {
						var i = 0;
						var name = field.name;
						var tokens = field.pathTokens = [];
						while ((x = indexRe.exec(name))) {
							tokens.push(name.substring(i + refOpener.length, delimRe.lastIndex - x[0].length).trim());
							i = indexRe.lastIndex;
						}
						tokens.push(name.substring(i + refOpener.length, name.length - refCloser.length).trim());
					});	
				}				
			} else if (refCloser) {

			} else if (expandArrayObjects) { //only path delimiter supported for nested objects expand and nested arrays supported
				indexRe = new RegExp('\\s*(?:' + regexEscape(indexOpener) + "(\\d+)" + regexEscape(indexCloser) + '|(' + regexEscape(refDelim) + '))\\s*', "g");
				headers.forEach(function(field) {
					var tokens = field.pathTokens = [];
					var name = field.name;
					var match;
					var i = indexRe.lastIndex = 0, end;
					while ((match = indexRe.exec(name))) {
						end = indexRe.lastIndex - match[0].length;
						if (match[1]) {
							if (i < end) {
								tokens.push(name.substring(i, end));
							}
							tokens.push(parseInt(match[1], 10));
						} else  {
							tokens.push(name.substring(i, end));
						}
						i = indexRe.lastIndex;
					}
					if (i < name.length) {
						tokens.push(name.substring(i));
					}
				});
			} else { //only path delimiter supported for nested objects expand and nested arrays not supported.
						//path token not allowed quote, spaces, other delimiters, ...
				headers.forEach(function(field) {
					field.pathTokens = field.name.split(refDelim);
				});
			}
		} else if (expandNestedObjects && refOpener) { //path token only enclosing supported without path token delim
			if ((refOpener === indexOpener) && (refCloser === indexCloser)) { //same enclosers for both path token and array index
																							//array indexes are integer values
				indexRe = new RegExp('\\s*' + regexEscape(indexOpener) + '\\s*([^' + regexEscape(indexOpener) + regexEscape(indexCloser) + ']+)\\s*' + regexEscape(indexCloser)+ '\\s*', "y");
				headers.forEach(function(field, i) {
					var i = 0;
					var name = field.path||field.name||field.ref||field.reference;
					if (Array.isArray(path)) {
						field.pathTokens = path;
					} else {
						var tokens = field.pathTokens = [];
						x = name.indexOf(refOpener);
						if (x >0) {
							v = name.substring(0, x).trim();
							if (v) {
								tokens[0] = v;
							}
							i = x;
							indexRe.lastIndex = i;
							name = headerRow[i];
							while ((x = indexRe.exec(name))) {
								tokens.push(/^\d+$/.test(x[1]) ? parseInt(x[1]) : _getPathToken(x[1]));
								i = indexRe.lastIndex;
							}
							if (i < name.length) {
								throw new Error('Incorrect header name: ' + name);
							}
						} else {
							tokens[0] = name;
						}							
					}
				});
			} else if (expandArrayObjects) { //path tokenization and array indexing uses differents enclosers 
				indexRe = new RegExp('\\s*(' 
					+ regexEscape(refOpener) 
					+ '\\s*([^\d' + regexEscape(refOpener) + regexEscape(refCloser) + ']+)\\s*' 
					+ regexEscape(refCloser)
					+ '|'
					+ regexEscape(indexOpener) + '\\s*(\d+)\\s*' + regexEscape(indexCloser)
					+ ')\\s*', "y");
				headers.forEach(function(field) {
					var i = 0;
					var name = field.path||field.name||field.ref||field.reference;
					if (Array.isArray(path)) {
						field.pathTokens = path;
					} else {
						var tokens = field.pathTokens = [];
						x = name.indexOf(refOpener);
						
						if (x >0) {
							v = name.substring(0, x).trim();
							if (v) {
								tokens[0] = v;
							}
							i = x;
						} else {
							x = name.indexOf(indexOpener);
							if (x >0) {
								v = name.substring(0, x).trim();
								if (v) {
									tokens[0] = v;
								}
								i = x;
							}
						}
						indexRe.lastIndex = i;
						while ((x = indexRe.exec(name))) {
							tokens.push(x[1]);
							i = indexRe.lastIndex;
						}
					}
				});
			} else { //only path token enclosing supported
				indexRe = new RegExp('\\s*' + regexEscape(indexOpener) 
						+ '\\s*([^' + regexEscape(refOpener) + regexEscape(refCloser) + ']+)\\s*' 
						+ regexEscape(indexCloser)+ '\\s*', "y");
				headers.forEach(function(field) {
					var i = 0;
					var name = field.path||field.name||field.ref||field.reference;
					if (Array.isArray(path)) {
						field.pathTokens = path;
					} else {
						var tokens = field.pathTokens = [];
						x = name.indexOf(refOpener);
						if (x >0) {
							v = name.substring(0, x).trim();
							if (v) {
								tokens[0] = v;
							}
							i = x;
						}
						indexRe.lastIndex = i;
						while ((x = indexRe.exec(name))) {
							tokens.push(x[1]);
							i = indexRe.lastIndex;
						}
					}
				});
			}
		} else if (expandArrayObjects) {
			indexRe = new RegExp('\\s*(' 
					+ regexEscape(refOpener) + '\\s*([^\d+])\\s*' + regexEscape(refCloser)
					+ '|'
					+ regexEscape(indexOpener) + '\\s*(\d+)\\s*' + regexEscape(indexCloser)
					+ ')\\s*', "y");
			headers.forEach(function(field) {
				var i = 0;
				var name = field.path||field.name||field.ref||field.reference;
				if (Array.isArray(path)) {
					field.pathTokens = path;
				} else {
					var tokens = field.pathTokens = [];
					x = name.indexOf(indexOpener);
					if (x >= 0) {
						tokens[0] = name.substring(0, x).trim();
						i = x;
						while ((x = indexRe.exec(name))) {
							tokens.push(parseInt(x[1]));
							i = indexRe.lastIndex;
						}
						if (i < name.length) {
							throw new Error('Incorrect field path')
						}
					} else {
						tokens[0] = name;
					}
				}
			});	
		} else { //no path (tokenization) supported and no array index supported 

		}
		if (i >= n) { // if csv raw data text not contains rows/records data
			return rows;
		}
		if (fieldFilter) { //fields filtering setted: only fields accepted by the filter are pocessed
			if (commentSymbol) { //fields filtering and comments allowed/supported
				throw new Error('Comments not yet supported');
			} else { //fields filtering but comments not allowed/supported
				while (i < n) {
					//TODO
					i++;
				}
			}
			throw new Error('Filter not yet supported');
		} else if (commentSymbol) { //no fields filtering but line commenting supported
			throw new Error('Comments not yet supported');
		} else if (expandNestedObjects || expandArrayObjects) { //nested objects and/or nested arrays supported and will be spread in many columns
			row = createRow();
			c = 0;
			while (i < n) {
				ch = textContent[i];
				if (ch === delim) {
					strVal = textContent.substring(offset, i);
					if (strVal) {
						_setFieldValue(row, col = headers[c], dialect.toValue(strVal, col));
					} else if (isEmptyStringAValue) {
						_setFieldValue(row, col = headers[c], dialect.valueOfEmptyString(col))
					}
					offset = ++i;
					c++; //go to next column
				} else if (ch === quote) {
					strVal = readQuotedString();
					col = headers[c++];
					_setFieldValue(row, col, strVal ? dialect.toValue(strVal, col) : dialect.valueOfEmptyQuotedString(col));
					if (textContent.startsWith(lineBreak, i)) {
						rows.push(row);
						i += lineBreak.length;
						row = createRow();
						c = 0;
					} else if (textContent.startsWith(delim, i)) {
						i += delim.length;
					}
					offset = i;
				} else if (textContent.startsWith(lineBreak, i)) {
					col = headers[c];
					if (strVal) {
						_setFieldValue(row, col = headers[c], dialect.toValue(strVal, col));
					} else if (isEmptyStringAValue) {
						_setFieldValue(row, col = headers[c], dialect.valueOfEmptyString(col))
					}
					rows.push(row);
					i += lineBreak.length;
					offset = i;
					row = createRow();
					c = 0;
				} else {
					i++;
				}
			}
			if (offset < n) {
				strVal = textContent.substring(offset);
				_setFieldValue(row, col = headers[c], strVal ? dialect.toValue(strVal, col) : dialect.valueOfEmptyString(col));
			}
			rows.push(row);
		} else if (itemType === 'array') {//result is an array of arrays and each nested object and/or nested array is represented as a string in JSON 
			row = [];
			while (i < n) {
				ch = textContent[i];
				if (ch === delim) {
					strVal = textContent.substring(offset, i);
					row.push(strVal ? dialect.toValue(strVal, headers[row.length]) : dialect.valueOfEmptyString(headers[row.length]));
					offset = ++i;
				} else if (ch === quote) {
					strVal = readQuotedString();
					row.push(strVal ? dialect.toValue(strVal, headers[row.length]) : dialect.valueOfEmptyQuotedString(headers[row.length]));
					if (textContent.startsWith(lineBreak, i)) {
						rows.push(row);
						i += lineBreak.length;
						row = createRow();
						c = 0;
					} else if (textContent.startsWith(delim, i)) {
						i += delim.length;
					}
					offset = i;
				} else if (textContent.startsWith(lineBreak, i)) {
					row.push(dialect.toValue(textContent.substring(offset, i), headers[row.length]));
					rows.push(row);
					i += lineBreak.length;
					offset = i;
					row = [];
				} else {
					i++;
				}
			}
			if (offset < n) {
				strVal = textContent.substring(offset);
				row.push(strVal ? dialect.toValue(strVal, headers[row.length]) : dialect.valueOfEmptyString(headers[row.length]));
			}
			rows.push(row);
		} else {//result is an array of objects and each nested object and/or nested array is represented as a string in JSON 
			row = {};
			c = 0;
			while (i < n) {
				ch = textContent[i];
				if (ch === delim) {
					strVal = textContent.substring(offset, i);
					col = headers[c++];
					row[col.name] = strVal ? dialect.toValue(strVal, col) : dialect.valueOfEmptyString(col);
					offset = ++i;
				} else if (ch === quote) {
					strVal = readQuotedString();
					col = headers[c++];
					row[col.name] = strVal ? dialect.toValue(strVal, col) : dialect.valueOfEmptyQuotedString(col);
					if (textContent.startsWith(lineBreak, i)) {
						rows.push(row);
						i += lineBreak.length;
						row = createRow();
						c = 0;
					} else if (textContent.startsWith(delim, i)) {
						i += delim.length;
					}
					offset = i;
				} else if (textContent.startsWith(lineBreak, i)) {
					col = headers[c];
					row[col.name] = dialect.toValue(textContent.substring(offset, i), col);
					rows.push(row);
					i += lineBreak.length;
					offset = i;
					row = {};
					c = 0;
				} else {
					i++;
				}
			}
			if (offset < n) {
				strVal = textContent.substring(offset);
				col = headers[c];
				row[col.name] = strVal ? dialect.toValue(strVal, col) : dialect.valueOfEmptyString(col);
			}
			rows.push(row);
		}
		return rows;
	};

	CSVProcessor.CSV_INJECTION_CHARS = CSV_INJECTION_CHARS;

	CSVProcessor.CSV_INJECTION_CHARS_REGEXP = CSV_INJECTION_CHARS_REGEXP;

	CSVProcessor.CSV_INJECTION_CHARS_STRING = CSV_INJECTION_CHARS_STRING;

	var csvProcessorProps = ['dialect', 'dialects'];

	if (typeof defProps === 'function') {
		defProps(CSVProcessor.prototype, csvProcessorProps);
	} else {
		Object.defineProperties(CSVProcessor.prototype, _getPropDefs(CSVProcessor.prototype, csvProcessorProps));
	}

	function _getPathToken(str){
		var re = /^(?:"((?:[^"]|\\")+)"|'((?:[^']|\\')+)')$/;
		var match = re.exec(str);
		return match[1] ? match[1].replace(/\\"/g, '"') : match[2] ? match[2].replace(/\\'/g, "'") : str;
	}

	if (typeof SereniX.data.addChild === 'function') {
		SereniX.data.addChild(CSVProcessor);
	} else {
		SereniX.data.CSVProcessor = CSVProcessor;
	}


	return CSVProcessor;

});