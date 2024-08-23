if (typeof globalNS === 'undefined') {
	globalNS = typeof window !== 'undefined' ? window :
		typeof global !== 'undefined' ? global :
			typeof self !== 'undefined' ? self : this;
}

if (typeof inBrowser === 'undefined') {
	globalNS.inBrowser = typeof window !== 'undefined';
}

if (typeof SereniX === 'undefined') {
	globalNS.SereniX = { data: {} };
} else if ((typeof SereniX.Namespace === 'function') && (typeof SereniX.Namespace.ns === 'function')) {
	SereniX.Namespace.ns("SereniX.data");
} else if (!SereniX.data) {
	SereniX.data = {};
}

if (typeof isPlainObj !== 'function') {
	isPlainObj = function (x) {
		return Object.prototype.toString.call(x) === '[object Object]';
	}
}




; (function () {

	function unboxVal(x) {
		if ((x instanceof Number) || (x instanceof Boolean) || (x instanceof String) || (x instanceof Function)) {
			return x.valueOf;
		}
		return x;
	}

	function def(root, name, Cls) {
		var factory = function () {
			return Cls;
		}
		if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
			module.exports = factory();
		} else if (typeof define === 'function' && define.amd) {
			define([name], factory);
		} else {
			root[name] = factory();
		}
		return Cls;
	}

	var EXCEL_BOM = '\ufeff'; // equivalent regex: /\xEF\xBB\xBF/

	var EXTENDED_ISO8601_DATE_TIME = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])(?:[T ](0[1-9]|1\d|2[0123]):([0-5]\d):([0-5]\d)(?:\.\d{3,})?(?:Z|[-+]\d{2}:?\d{2}|UTC|GMT))?$/;


	function regexEscape(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	var toBool = function (val) {
		var typ;
		if ((val instanceof Boolean) || (val instanceof Number) || (val instanceof String)) {
			val = val.valueOf();
		}
		typ = typeof val;
		if (typ === 'boolean') {
			return val;
		}
		if (typ === 'number') {
			return !!val;
		}
		if (typ === 'string') {
			return /^(f(alse)?|off|n(o(k|ne?)?)?|ko|0)$/i.test(val);
		}
		return !!val;
	};

	/**
	 * 
	 * @param {Date} d
	 * @param {Boolean} date1904  The type of Excel date use for conversion
	 *      <ul>
	 *      <li>True value means January 1, 1904 is used as a 
	 starting point This is the default date system in earlier versions of 
	Excel for Mac.</li>
	<li>False value means January 1, 1900 is used as a starting point.
	This is the default date system in Excel for Windows, Excel 2016 for 
	Mac, and Excel for Mac 2011</li>
	</ul>
	* @returns {Number}
	*/
	function dateToExcel(d, date1904) {
		return 25569 + (d.getTime() / (24 * 3600 * 1000)) - (date1904 ? 1462 : 0);
	}
	/**
	 * 
	 * @param {Number} v
	 * @param {boolean} date1904 The type of Excel date use for conversion
	 *      <ul>
	 *      <li>True value means January 1, 1904 is used as a 
	 starting point This is the default date system in earlier versions of 
	Excel for Mac.</li>
	<li>False value means January 1, 1900 is used as a starting point.
	This is the default date system in Excel for Windows, Excel 2016 for 
	Mac, and Excel for Mac 2011</li>
	</ul>
	* @returns {Date}
	*/
	function excelToDate(v, date1904) {
		var msSinceEpoch = Math.round((v - 25569 + (date1904 ? 1462 : 0)) * 24 * 3600 * 1000);
		return new Date(msSinceEpoch);
	}

	/**
	 * 
	 * @param {Number} y    The year
	 * @returns {Boolean}
	 */
	function isLeapYear(y) {
		if ((y % 4) !== 0) return false;
		if (((y % 4) === 0) && ((y % 100) !== 0)) return true;
		if ((y % 100) === 0 && ((y % 400) !== 0)) return false;
		if ((y % 400) === 0) return true;
		return false;
	}

	function randomYear(minYear, maxYear) {
		if (maxYear == undefined)
			maxYear = (new Date()).getFullYear();
		if ((minYear == undefined) || (minYear < 0))
			minYear = maxYear - 10;
		return minYear + Math.floor(Math.random() * (maxYear - minYear));
	}

	var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	function randomMonth() {
		return months[Math.floor(Math.random() * 11)];
	}

	/**
	 * 
	 * @param {type} year
	 * @param {type} month  Values are in the range 0 to 11 
	 *      (January = 0, February = 1, March = 2, ..., December = 10). 
	 *      <p>The first January value is 0 and december value is 11.</p>
	 * @returns {Number}
	 */
	function getDaysInMonth(year, month) {
		var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (month === 1) {
			return isLeapYear(year) ? 29 : 28;
		}
		return days[month];
	}

	function randomHour() {
		return Math.floor(Math.random() * 23);
	}

	function randomHour12() {
		return Math.floor(Math.random() * 11);
	}

	function randomMinute() {
		return Math.floor(Math.random() * 59);
	}

	function randomSecond() {
		return Math.floor(Math.random() * 59);
	}

	function randomMillisecond() {
		return Math.floor(Math.random() * 999);
	}

	function randomDayOfMonth(year, month) {
		return Math.floor(Math.random() * getDaysInMonth(year, month - 1));
	}

	function randomUnixTimestamp(minYear, maxYear, type) {
		return Math.floor(randomTimestamp(minYear, maxYear, type) / 1000);
	}


	function randomTimestamp(minYear, maxYear, type) {
		var str = sqlRandomDate(minYear, maxYear);
		switch (type || 'hms') {
			case 'hms':
				str += lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2)
					+ ':' + lpad(randomSecond(), 2);
				break;
			case 'hm':
				str += lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2);
				break;
			case 'h':
				str += lpad(randomHour(), 2)
					+ ':00';
				break;
			case 'full':
			case 'all':
				str += lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2)
					+ ':' + lpad(randomSecond(), 2);
				+ '.' + lpad(randomMillisecond(), 3);
				break;
			default:
				throw new Error('Incorrect date time format type: ' + type);
		}
		return (new Date(str)).getTime();
	}
	var stringRe = /(?:^|(\|)[ \t]*)(?:(?:varchar2?|n?char(?:acter)?)(?:\s+varying)?|string|(?:(?:tiny|small|medium|long|short)[ \t_]*)?text|clob|name|email|tel|uuid|ip|url|urn|phonenum|credit[_-]?card[_-]?num)(?:[ \t]*(\|)|$)/;
	
	function isStringDataType(dataType, val) {
		var match = stringRe.exec(dataType||toType(val));
		if (match) {
			return match[1]||match[2] ? toType(val) === 'string' : true;
		}
	}
	var stringRe2 = /(?:^|(\|)[ \t]*)((?:varchar2?|n?char(?:acter)?)(?:\s+varying)?|string|(?:(?:tiny|small|medium|long|short)[ \t_]*)?text|clob|name|email|tel|uuid|ip|url|urn|phonenum|credit[_-]?card[_-]?num)(?:[ \t]*(\|)|$)/;
	
	function matchStringDataType(dataType, val) {
		var typ = toType(val);
		var match = stringRe2.exec(dataType||typ);
		if (match) {
			return match[1]||match[3] ? typ === 'string' ? match[2] : null : match[2];
		}
		return null;
	}

	function isFloatingPointDataType(dataType) {
		return /number|numeric|decimal|float|real|double|long double|double double/.test(dataType||toType(val));
	}

	function isIntegerDataType(dataType) {
		return /^(unsigned($|[ \t]*?(int(eger)|byte|short|long([ \t]long)?)?)|(tiny|small|medium|long)[ \t]*int(eger)?([ \t]+unsigned)?|u?int(?:\d+)?|ubyte|ushort|ulong)$/.test(dataType);
	}

	var MYSQL_INTEGER_TYPES;
	/*!*
	 * 
	 * @private
	 * @param {*} dataType Lower case data type
	 * @param {*} val 
	 * @returns 
	 */
	function checkNumberDataType(dataType, val) {
		var num = val;
		var intervals = ADataDialect.MYSQL_INTEGER_TYPES ? ADataDialect.MYSQL_INTEGER_TYPES[dataType] : ADataDialect.BUILTIN_NUMBER_TYPE_INTERVALS ? ADataDialect.BUILTIN_NUMBER_TYPE_INTERVALS[dataType] : false;
		if (!intervals && (ADataDialect.MYSQL_INTEGER_TYPES || ADataDialect.BUILTIN_NUMBER_TYPE_INTERVALS)) {
			return false;
		}
		if (typeof num === 'string') {
			if (isNaN(num = parseFloat(num))) {
				throw new TypeError('The given value does not match a number')
			}
		}
		if (intervals) {
			if (intervals.min > num || intervals.max < num) {
				throw new TypeError('The given value is out of bounds')
			}
		}
		return num;
	}
	/**
	 * 
	 * @class ADataDialect
	 */
	var ADataDialect = def(this, 'ADataDialect', function ADataDialect($) {
		var x;
		if (isPlainObj($)) {
			x = $.allowLikeWildcardCharacters == undefined ? $.allowLikeWildcardChars == undefined ? $.allowLikeWildcards == undefined ?
				$.supportLikeWildcardCharacters == undefined ? $.supportLikeWildcardChars == undefined ?
					$.supportLikeWildcards == undefined ? $.allowWildcardCharacters == undefined ? $.allowWildcardChars == undefined ? $.allowWildcards == undefined ?
						$.supportWildcardCharacters == undefined ? $.supportWildcardChars == undefined ?
							$.supportWildcards : $.supportWildcardChars : $.supportWildcardCharacters :
						$.allowWildcards : $.allowWildcardChars : $.allowWildcardCharacters : $.supportLikeWildcards : $.supportLikeWildcardChars : $.supportLikeWildcardCharacters :
				$.allowLikeWildcards : $.allowLikeWildcardChars : $.allowLikeWildcardCharacters;
			if ((x == undefined) || (x === 0)) {
				this.allowLikeWildcardChars = false;
			}
		}
	});

	globalNS.ADataDialect = ADataDialect;

	ADataDialect.__CLASS__ = ADataDialect.prototype.__CLASS__ = ADataDialect;

	ADataDialect.__CLASS_NAME__ = ADataDialect.prototype.__CLASS_NAME__ = 'ADataDialect';

	ADataDialect.EXCEL_BOM = EXCEL_BOM;

	ADataDialect.EXTENDED_ISO8601_DATE_TIME = EXTENDED_ISO8601_DATE_TIME;

	ADataDialect.prototype.randomYear = randomYear;

	ADataDialect.randomHour12 = randomHour12;

	ADataDialect.randomHour = randomHour;

	ADataDialect.randomHour24 = randomHour;

	ADataDialect.prototype.formatDate = function (date) {
		return lpad(date.getFullYear(), 4)
			+ '-' + lpad(date.getMonth() + 1, 2)
			+ '-' + lpad(date.getDate(), 2) ;
	};


	ADataDialect.prototype.stringValue = function(str) {
		return str;
	};
	/**
	 * 
	 * @param {*} val 
	 * @param {*} dataType 
	 * @return {Date}
	 */
	ADataDialect.prototype.toDate = function (val, dataType) {
		return val;
	};
	/**
	 * 
	 * @param {*} val 
	 * @param {*} dataType 
	 * @return {Date}
	 */
	ADataDialect.prototype.toDateTime = function (val, dataType) {
		return val;
	};
	/**
	 * 
	 * @param {*} val 
	 * @param {*} column 
	 * @returns 
	 */
	ADataDialect.prototype.toValue = function (val, column) {
		return val;
	}

	ADataDialect.prototype.formatDateTime = function (date, typeFormat, dateTimeDelim) {
		return this.formatDate() + (dateTimeDelim || this.dateTimeDelim || ' ')
			+ this.formatTime(typeFormat || 'full');
	};

	ADataDialect.prototype.formatTime = function (date, type) {
		switch (type || 'hms') {
			case 'hms':
				return lpad(date.getHours(), 2)
					+ ':' + lpad(date.getMinutes(), 2)
					+ ':' + lpad(date.getSeconds(), 2);
			case 'hm':
				return lpad(date.getHours(), 2)
					+ ':' + lpad(date.getMinutes(), 2);
			case 'h':
				return lpad(date.getHours(), 2)
					+ ':00';
			case 'full':
			case 'all':
				return lpad(date.getHours(), 2)
					+ ':' + lpad(date.getMinutes(), 2)
					+ ':' + lpad(date.getSeconds(), 2)
					+ '.' + lpad(date.getMilliseconds(), 3);
			default:
				throw new Error('Incorrect date time format type: ' + type);
		}
	};

	ADataDialect.prototype.randomTimestamp = randomTimestamp;

	ADataDialect.prototype.fromString = function (table, schema) {
		var oq = this.openQuote || '',
			cq = this.closeQuote || '';
		return isPlainObj(table) ? (
			isPlainObj(schema) ? oq + schema.name + cq + '.' + oq + table.name + cq :
				(schema ? oq + schema + cq + '.' + oq + table.name + cq :
					(isPlainObj(table.schema) ? oq + table.schema.name + cq + '.' + oq + table.name + cq :
						((schema = table.schemaName || table.schema) ?
							oq + schema + cq + '.' + oq + table.name + cq : oq + table.name + cq
						)
					)
				)
		) : oq + table + cq;
	};

	ADataDialect.prototype.convert = function (val, column) {
		return val;
	};

	ADataDialect.randomTimestamp = randomTimestamp;

	globalNS.ADataDialect = ADataDialect;


	var DEFAULT_DATE_TIME_FORMAT_DELIMITERS = '-/,.;:'.split('');

	var DEFAULT_DATE_TIME_FORMAT_STRING_QUOTE = '"';
	/**
	 * 
	 * @class SQLDialect
	 * @param {Object|string} [$] 
	 * @param {string} [$1] 
	 * @param {string} [$2] 
	 */
	function SQLDialect($, $1, $2) {
		ADataDialect.apply(this, arguments);
		if ($ instanceof String) {
			$ = $.valueOf;
		}
		if (isPlainObj($)) {
			this.openQuote = $.openQuote || $.quote || this.__CLASS__.DEFAULT_OPEN_QUOTE || '`';
			this.closeQuote = $.closeQuote || this.__CLASS__.DEFAULT_CLOSE_QUOTE || this.openQuote;
			this.booleanDataType = $.booleanDataType || $.boolDataType || 'TINYINT(1)';
		} else if (typeof $ === 'string') {
			if ($1 instanceof String) {
				$1 = $1.valueOf;
			}
			this.openQuote = $ != undefined ? $ : this.__CLASS__.DEFAULT_OPEN_QUOTE || '`';
			this.closeQuote = $1 != undefined ? $1 : this.__CLASS__.DEFAULT_CLOSE_QUOTE | this.openQuote;
			if ($2 instanceof String) {
				$2 = $2.valueOf;
			}
			if (typeof $2 === 'string') {
				this.booleanDataType = $2 || 'TINYINT(1)';
			} else {
				this.booleanDataType = 'TINYINT(1)';
			}
		} else {
			this.openQuote = '`';
			this.closeQuote = '`';
			this.booleanDataType = 'TINYINT(1)';
		}
	}


	globalNS.SQLDialect = SQLDialect;

	SQLDialect.DATE_TIME_FORMAT_DELIMITERS = DEFAULT_DATE_TIME_FORMAT_DELIMITERS;

	SQLDialect.DATE_TIME_FORMAT_STRING_QUOTE = DEFAULT_DATE_TIME_FORMAT_STRING_QUOTE;

	SQLDialect.prototype = new ADataDialect();

	SQLDialect.prototype.__CLASS__ = SQLDialect.__CLASS__ = SQLDialect;

	SQLDialect.prototype.__CLASS_NAME__ = SQLDialect.__CLASS_NAME__ = 'SQLDialect';

	SQLDialect.__SUPER__ = SQLDialect.__SUPER_CLASS__ = ADataDialect;

	SQLDialect.EXTENDED_ISO8601_DATE_TIME = ADataDialect.EXTENDED_ISO8601_DATE_TIME;

	SQLDialect.randomTimestamp = randomTimestamp;

	SQLDialect.DEFAULT_OPEN_QUOTE = '`';

	SQLDialect.DEFAULT_CLAUSE_QUOTE = '`';

	SQLDialect.prototype.convertBool = function (val) {
		if (val == undefined) {
			return 'NULL';
		}
		return val ? 1 : 0;
	};
	/**
	 * Converts the given data to supported this SQL dialect store (insert) data type value.
	 * <p><b>Note</b>: Resulting string value are already quoted ready to use in SQL statement (insert, update, ...).</p>
	 * @param {*} val 
	 * @param {Object} column 
	 * @returns {string|number}
	 */
	SQLDialect.prototype.convert = function (val, column) {
		var checkVal;
		if (val == undefined) {
			return 'NULL';
		}
		var dataType = (column.dataType || '').toLowerCase();
		if (isStringDataType(dataType, val) || !dataType) {
			return this.openQuote + val.replace(new RegExp(this.openQuote === this.closeQuote ? "(" + this.openQuote + ")" :
				"(" + this.openQuote + ")|(" + this.closeQuote + ")", "g"), function ($0, $1, $2) { return '\\' + ($1 || $2); }) + this.closeQuote;
		}
		if ((checkVal = checkNumberDataType(dataType, val)) !== false) {
			return checkVal;
		}
		if (/^bool(ean)?$/.test(dataType)) {
			return this.convertBool(val);
		}
		return val;
	}

	SQLDialect.prototype.formatDate = function (date) {
		return this.openQuote
			+ ADataDialect.prototype.formatDate.call(arguments)
			+ this.closeQuote;
	};

	SQLDialect.prototype.formatDateTime = function (date, typeFormat, dateTimeDelim) {
		return this.openQuote
			+ ADataDialect.prototype.formatDateTime.call(arguments)
			+ this.closeQuote;
	};

	SQLDialect.prototype.formatTime = function (date, type) {
		return this.openQuote
			+ ADataDialect.prototype.formatTime.call(arguments)
			+ this.closeQuote;
	};


	SQLDialect.prototype.stringValue = function (str) {
		return str;
	};
	SQLDialect.prototype.dateValue = function (date) {
		return val;
	};

	SQLDialect.prototype.dateTimeValue = function (date) {
		return val;
	};

	SQLDialect.prototype.timeValue = function (date) {
		return val;
	};

	function sqlRandomDate(minYear, maxYear) {
		var year = randomYear(minYear, maxYear);
		var month = randomMonth();
		return lpad(year, 4) + '-' + lpad(month, 2) + '-' + lpad(randomDayOfMonth(year, month), 2);
	}

	function sqlRandomTime(type) {
		switch (type || 'hms') {
			case 'hms':
				return lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2)
					+ ':' + lpad(randomSecond(), 2);
			case 'hm':
				return lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2);
			case 'h':
				return lpad(randomHour(), 2)
					+ ':00';
			case 'full':
			case 'all':
				return lpad(randomHour(), 2)
					+ ':' + lpad(randomMinute(), 2)
					+ ':' + lpad(randomSecond(), 2);
				+ '.' + lpad(randomMillisecond(), 3);
			default:
				throw new Error('Incorrect date time format type: ' + type);
		}
	}

	SQLDialect.prototype.randomDate = function (minYear, maxYear) {
		return this.openQuote + sqlRandomDate(minYear, maxYear) + this.closeQuote;
	};

	SQLDialect.prototype.randomTime = function (type) {
		return this.openQuote + sqlRandomTime(type) + this.closeQuote;
	};

	SQLDialect.prototype.randomDateTime = function (minYear, maxYear, type, dataTimeDelim) {
		return this.openQuote + sqlRandomDate(minYear, maxYear)
			+ (dataTimeDelim || this.dataTimeDelim || ' ')
			+ sqlRandomTime(type) + this.closeQuote;
	};

	SQLDialect.prototype.del = function (table, where, schema) {
		where = this.whereString(where);
		if (where) {
			where = ' WHERE ' + where;
		} else {
			where = '';
		}
		return 'DELETE FROM ' + this.fromString(table, schema) + where;
	};

	SQLDialect.prototype.truncateTable = function (table, schema) {
		return 'TRUNCATE TABLE ' + this.fromString(table, schema);
	};

	SQLDialect.prototype.whereString = function (where) {
		if (where instanceof String) {
			where = where.valueOf();
		}
		if (!where || /^(\*|all)$/.test(where))
			return '';
		if (typeof where === 'string') {
			return where;
		} else if (isPlainObj(where)) {
			throw new Error('Not yet supported');
		} else if (Array.isArray(where)) {
			throw new Error('Not yet supported');
		} else {
			throw new Error('Incorrect where clause');
		}
	};

	/**
	 * 
	 * @class MySQLDialect
	 * @param {Object|string} [$] 
	 * @param {string} [$1] 
	 * @param {string} [$2] 
	 */
	function MySQLDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);
	}

	MySQLDialect.prototype = new SQLDialect();

	MySQLDialect.DEFAULT_OPEN_QUOTE = '"';

	MySQLDialect.DEFAULT_CLAUSE_QUOTE = '"';

	MySQLDialect.__CLASS__ = MySQLDialect.prototype.__CLASS__ = MySQLDialect;

	MySQLDialect.__CLASS_NAME__ = MySQLDialect.prototype.__CLASS_NAME__ = 'MySQLDialect';

	MySQLDialect.__SUPER__ = MySQLDialect.__SUPER_CLASS__ = SQLDialect;

	MySQLDialect.EXTENDED_ISO8601_DATE_TIME = ADataDialect.EXTENDED_ISO8601_DATE_TIME;

	MYSQL_DATE_FORMATS_MAP = {
		'%Y': 'YYYY', // 4-digit year
		'%y': 'YY', // 2-digit year
		'%m': 'MM', // Month, numeric (00 to 12)
		'%d': 'DD', // Day of the month (00 to 31)
		'%H': 'HH24', // Hour (00 to 23)
		'%i': 'MI', // Minutes (00 to 59)
		'%s': 'SS', // Seconds (00 to 59)
		'%M': 'MMMM', // Month name (January to December)
		'%W': 'DAY', // Day name (Sunday to Saturday)
	};


	/**
	 * 
	 * @class PgSQLDialect
	 * @param {Object|string} [$] 
	 * @param {string} [$1] 
	 * @param {string} [$2] 
	 */
	function PgSQLDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);
		this.openQuote = '"';
		this.closeQuote = '"';
		if (isPlainObj($)) {
			if ($.openQuote) {
				this.openQuote = $.openQuote;
				this.closeQuote = $.closeQuote || this.openQuote;
			} else if ($.closeQuote) {
				this.openQuote = this.closeQuote = $.closeQuote;
			} else if ($.quote || $.encloser) {
				this.openQuote = this.closeQuote = $.openQuote;
			}

		}
	}

	PgSQLDialect.prototype = new SQLDialect();

	PgSQLDialect.DEFAULT_OPEN_QUOTE = '"';

	PgSQLDialect.DEFAULT_CLAUSE_QUOTE = '"';

	PgSQLDialect.__CLASS__ = PgSQLDialect.prototype.__CLASS__ = PgSQLDialect;

	PgSQLDialect.__CLASS_NAME__ = PgSQLDialect.prototype.__CLASS_NAME__ = 'PgSQLDialect';

	PgSQLDialect.__SUPER__ = PgSQLDialect.__SUPER_CLASS__ = SQLDialect;

	PgSQLDialect.EXTENDED_ISO8601_DATE_TIME = ADataDialect.EXTENDED_ISO8601_DATE_TIME;

	var POSTGRESQL_DATE_FORMATS_MAP = {
		'YYYY': 'YYYY', // 4-digit year
		'MM': 'MM', // 2-digit month
		'DD': 'DD', // 2-digit day of the month
		'Day': 'DAY', // Full name of the day
		'DY': 'DY', // Abbreviated name of the month
		'Mon': 'MON', // Abbreviated month name
		'Month': 'MONTH', // Full name of the month
		'HH': 'HH12',
		'HH12': 'HH12',
		'HH24': 'HH24', // Hours (00 to 23)
		'MI': 'MI', // Minutes (00 to 59)
		'SS': 'SS', // Seconds (00 to 59)
	};

	var PGSQL_DATE_FORMATS_MAP = POSTGRESQL_DATE_FORMATS_MAP;

	PgSQLDialect.DATE_FORMATS_MAP = PGSQL_DATE_FORMATS_MAP;

	var PGSQL_DATE_FORMAT_SPECIFIER_DEFS = {};

	var PGSQL_DATE_FORMAT_SPECIFIERS = (function (entries) {
		var i = 0, n = Math.floor(entries.length / 2);
		var specifiers = [];
		var specifier;
		for (; i; i++) {
			specifiers.push(specifier = entries[2 * i]);
			PGSQL_DATE_FORMAT_SPECIFIER_DEFS[specifier] = entries[2 * i + 1];
		}
		return specifiers;
	})([
		'HH', 'hour of day (01–12)',
		'HH12', 'hour of day (01–12)',
		'HH24', 'hour of day (00–23)',
		'MI', 'minute (00–59)',
		'SS', 'second (00–59)',
		'MS', 'millisecond (000–999)',
		'US', 'microsecond (000000–999999)',
		'FF1', 'tenth of second (0–9)',
		'FF2', 'hundredth of second (00–99)',
		'FF3', 'millisecond (000–999)',
		'FF4', 'tenth of a millisecond (0000–9999)',
		'FF5', 'hundredth of a millisecond (00000–99999)',
		'FF6', 'microsecond (000000–999999)',
		'SSSS, SSSSS', 'seconds past midnight (0–86399)',

		'AM', 'meridiem indicator (without periods)',
		'am', 'meridiem indicator (without periods)',
		'PM', 'meridiem indicator (without periods)',
		'pm', 'meridiem indicator (without periods)',

		'A.M.', 'meridiem indicator (with periods)',
		'a.m.', 'meridiem indicator (with periods)',
		'P.M.', 'meridiem indicator (with periods)',
		'p.m.', 'meridiem indicator (with periods)',
		'Y,YYY', 'year (4 or more digits) with comma',
		'YYYY', 'year (4 or more digits)',
		'YYY', 'last 3 digits of year',
		'YY', 'last 2 digits of year',
		'Y', 'last digit of year',
		'IYYY', 'ISO 8601 week-numbering year (4 or more digits)',
		'IYY', 'last 3 digits of ISO 8601 week-numbering year',
		'IY', 'last 2 digits of ISO 8601 week-numbering year',
		'I', 'last digit of ISO 8601 week-numbering year',

		'BC', 'era indicator (without periods)',
		'bc', 'era indicator (without periods)',
		'AD', 'era indicator (without periods)',
		'ad', 'era indicator (without periods)',

		'B.C.', 'era indicator (with periods)',
		'b.c.', 'era indicator (with periods)',
		'A.D.', 'era indicator (with periods)',
		'a.d.', 'era indicator (with periods)',

		'MONTH', 'full upper case month name (blank-padded to 9 chars)',
		'Month', 'full capitalized month name (blank-padded to 9 chars)',
		'month', 'full lower case month name (blank-padded to 9 chars)',
		'MON', 'abbreviated upper case month name (3 chars in English, localized lengths vary)',
		'Mon', 'abbreviated capitalized month name (3 chars in English, localized lengths vary)',
		'mon', 'abbreviated lower case month name (3 chars in English, localized lengths vary)',
		'MM', 'month number (01–12)',
		'DAY', 'full upper case day name (blank-padded to 9 chars)',
		'Day', 'full capitalized day name (blank-padded to 9 chars)',
		'day', 'full lower case day name (blank-padded to 9 chars)',
		'DY', 'abbreviated upper case day name (3 chars in English, localized lengths vary)',
		'Dy', 'abbreviated capitalized day name (3 chars in English, localized lengths vary)',
		'dy', 'abbreviated lower case day name (3 chars in English, localized lengths vary)',
		'DDD', 'day of year (001–366)',
		'IDDD', 'day of ISO 8601 week-numbering year (001–371; day 1 of the year is Monday of the first ISO week)',
		'DD', 'day of month (01–31)',
		'D', 'day of the week, Sunday (1) to Saturday (7)',
		'ID', 'ISO 8601 day of the week, Monday (1) to Sunday (7)',
		'W', 'week of month (1–5) (the first week starts on the first day of the month)',
		'WW', 'week number of year (1–53) (the first week starts on the first day of the year)',
		'IW', 'week number of ISO 8601 week-numbering year (01–53; the first Thursday of the year is in week 1)',
		'CC', 'century (2 digits) (the twenty-first century starts on 2001-01-01)',
		'J', 'Julian Date (integer days since November 24, 4714 BC at local midnight; see Section B.7)',
		'Q', 'quarter',
		'RM', 'month in upper case Roman numerals (I–XII; I=January)',
		'rm', 'month in lower case Roman numerals (i–xii; i=January)',
		'TZ', 'upper case time-zone abbreviation (only supported in to_char)',
		'tz', 'lower case time-zone abbreviation (only supported in to_char)',
		'TZH', 'time-zone hours',
		'TZM', 'time-zone minutes',
		'OF', 'time-zone offset from UTC (only supported in to_char)'
	]);

	PgSQLDialect.DATE_FORMAT_SPECIFIERS = PGSQL_DATE_FORMAT_SPECIFIERS;

	PgSQLDialect.DATE_FORMAT_SPECIFIER_DEFS = PGSQL_DATE_FORMAT_SPECIFIER_DEFS;

	/**
	 * 
	 * @class MsAccessDialect
	 * @param {Object|string} [$] 
	 * @param {string} [$1] 
	 * @param {string} [$2] 
	 */
	function MsAccessDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);
	}

	MsAccessDialect.prototype = new SQLDialect();

	MsAccessDialect.DEFAULT_OPEN_QUOTE = '"';

	MsAccessDialect.DEFAULT_CLAUSE_QUOTE = '"';

	MsAccessDialect.__CLASS__ = MsAccessDialect.prototype.__CLASS__ = MsAccessDialect;

	MsAccessDialect.__CLASS_NAME__ = MsAccessDialect.prototype.__CLASS_NAME__ = 'MsAccessDialect';

	MsAccessDialect.__SUPER__ = MsAccessDialect.__SUPER_CLASS__ = SQLDialect;

	MsAccessDialect.EXTENDED_ISO8601_DATE_TIME = EXTENDED_ISO8601_DATE_TIME;

	MsAccessDialect.prototype.del = function (table, where, schema) {
		where = this.whereString(where);
		return 'DELETE * FROM ' + this.fromString(table, schema) + (where ? where = ' WHERE ' + where : '');
	};

	MsAccessDialect.prototype.truncateTable = function (table, schema) {
		return this.del(table, null, schema);
	};


	function TSQLDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);
	}

	TSQLDialect.prototype = new SQLDialect();

	TSQLDialect.DEFAULT_OPEN_QUOTE = '"';

	TSQLDialect.DEFAULT_CLAUSE_QUOTE = '"';

	TSQLDialect.__CLASS__ = TSQLDialect.prototype.__CLASS__ = TSQLDialect;

	TSQLDialect.__CLASS_NAME__ = TSQLDialect.prototype.__CLASS_NAME__ = 'TSQLDialect';

	TSQLDialect.__SUPER__ = TSQLDialect.__SUPER_CLASS__ = SQLDialect;

	var SQLSERVER_DATE_FORMATS_MAP = {
		'd': 'SHORT_DATE', //Short date pattern.
		'D': 'LONG_DATE', //Long date pattern.
		'dd': 'DD', //Day of the month, from 01 through 31.
		'ddd': 'DY', //Abbreviated name of the day of the week.
		'dddd': 'DAY', //Full name of the day of the week.
		'MM': 'MM', //onth, from 01 through 12.
		'MMM': 'MON', //Abbreviated name of the month.
		'MMMM': 'MONTH', //Full name of the month.
		'yyyy': 'YYYY', //ear, four digits.
		'HH': 'HH24', //Hour in 24-hour format, from 00 through 23.
		'H': 'H12', //Hour in 24-hour format, from 0 through 12.
		'hh': 'HH12', //Hour in 12-hour format, from 00 through 11.
		'h': 'H12', //Hour in 12-hour format, from 0 through 11.
		'mm': 'MI', //Minute, from 00 through 59.
		'm': 'I', //Minute, from 0 through 59.
		'ss': 'SS', //Second, from 00 through 59.
		's': 'S', //Second, from 0 through 59.
	};

	var TRANSACT_SQL_DATE_FORMATS_MAP = SQLSERVER_DATE_FORMATS_MAP;

	TSQLDialect.DATE_FORMATS_MAP = TRANSACT_SQL_DATE_FORMATS_MAP;

	function SQLServerDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);
	}

	SQLServerDialect.prototype = new SQLDialect();

	SQLServerDialect.DEFAULT_OPEN_QUOTE = '"';

	SQLServerDialect.DEFAULT_CLAUSE_QUOTE = '"';

	SQLServerDialect.__CLASS__ = SQLServerDialect.prototype.__CLASS__ = SQLServerDialect;

	SQLServerDialect.__CLASS_NAME__ = SQLServerDialect.prototype.__CLASS_NAME__ = 'SQLServerDialect';

	SQLServerDialect.__SUPER__ = SQLServerDialect.__SUPER_CLASS__ = SQLDialect;

	SQLServerDialect.DATE_FORMATS_MAP = SQLSERVER_DATE_FORMATS_MAP;

	SQLServerDialect.prototype.getDateAndTimeFormatType = function (lang) {
		return this.__dateAndTimeFormatType_ || (this.__dateAndTimeFormatType_ = 'ISO');
	};

	SQLServerDialect.prototype.setDateAndTimeFormatType = function (fmtType) {
		var _fmtType;
		if (!arguments.length) {
			throw new TypeError('Argument expected');
		}
		_fmtType = fmtType.toUpperCase();
		if (_fmtType === 'ISO') {
			_fmtType = 'ISO8601';
		}
		if (('STR_TO_DATE' !== _fmtType) && ('ISO8601' !== _fmtType) && ('CONVERT' !== _fmtType)) {
			throw new TypeError('Incorrect argument value: ' + fmtType);
		}
		this.__nlsDateLanguage_ = _fmtType;
		return this;
	};

	SQLServerDialect.prototype.setDateFormat = function (dateFormat) {
		this.__dateFormat_ = dateFormat;
		return this;
	};

	SQLServerDialect.prototype.getDateFormat = function () {
		return this.__dateFormat_;
	};

	SQLServerDialect.prototype.setDateTimeFormat = function (dateTimeFormat) {
		this.__dateTimeFormat_ = dateTimeFormat;
		return this;
	};

	SQLServerDialect.prototype.getDateTimeFormat = function () {
		return this.__dateTimeFormat_;
	};

	SQLServerDialect.prototype.setTimeFormat = function (timeFormat) {
		this.__timeFormat_ = timeFormat;
		return this;
	};

	SQLServerDialect.prototype.getTimeFormat = function () {
		return this.__timeFormat_;
	};


	var ORACLE_NLS_TERRITORIES = [
		'ALGERIA',
		'AMERICA',
		'AUSTRALIA',
		'AUSTRIA',
		'BAHRAIN',
		'BANGLADESH',
		'BELGIUM',
		'BRAZIL',
		'BULGARIA',
		'CANADA',
		'CATALONIA',
		'CHINA',
		'CIS',
		'CROATIA',
		'CYPRUS',
		'CZECH',
		'CZECHOSLOVAKIA',
		'DENMARK',
		'DJIBOUTI',
		'EGYPT',
		'ESTONIA',
		'FINLAND',
		'FRANCE',
		'GERMANY',
		'GREECE',
		'HONG KONG',
		'HUNGARY',
		'ICELAND',
		'INDONESIA',
		'IRAQ',
		'IRELAND',
		'ISRAEL',
		'ITALY',
		'JAPAN',
		'JORDAN',
		'KAZAKHSTAN',
		'KOREA',
		'KUWAIT',
		'LATVIA',
		'LEBANON',
		'LIBYA',
		'LITHUANIA',
		'LUXEMBOURG',
		'MALAYSIA',
		'MAURITANIA',
		'MEXICO',
		'MOROCCO',
		'NEW ZEALAND',
		'NORWAY',
		'OMAN',
		'POLAND',
		'PORTUGAL',
		'QATAR',
		'ROMANIA',
		'SAUDI ARABIA',
		'SINGAPORE',
		'SLOVAKIA',
		'SLOVENIA',
		'SOMALIA',
		'SOUTH AFRICA',
		'SPAIN',
		'SUDAN',
		'SWEDEN',
		'SWITZERLAND',
		'SYRIA',
		'TAIWAN',
		'THAILAND',
		'THE NETHERLANDS',
		'TUNISIA',
		'TURKEY',
		'UKRAINE',
		'UNITED ARAB EMIRATES',
		'UNITED KINGDOM',
		'UZBEKISTAN',
		'VIETNAM',
		'YEMEN'
	];

	var ORACLE_TIME_FORMAT_TYPES = ['TO_DATE', 'DATE_PREFIX'];

	var ORACLE_NSL_DATE_LANGUAGE_NAMES = [];

	var ORACLE_NSL_DATE_LANG_NAMES_MAP = {};

	var ORACLE_NSL_DATE_LANGS_MAP = {};

	var ORACLE_NSL_DATE_LANGUAGES = (function (entries) {
		var i = 0, n = Math.floor(entries.length / 2);
		var langs = [];
		for (; i < n; i++) {
			ORACLE_NSL_DATE_LANGUAGE_NAMES.push(entries[2 * i]);
			langs.push(entries[2 * i + 1]);
			ORACLE_NSL_DATE_LANG_NAMES_MAP[entries[2 * i]] = entries[2 * i + 1];
			ORACLE_NSL_DATE_LANGS_MAP[entries[2 * i + 1]] = entries[2 * i];
		}

		return langs;
	})([
		'us', 'AMERICAN',
		'ar', 'ARABIC',
		'bn', 'BENGALI',
		'ptb', 'BRAZILIAN PORTUGUESE',
		'bg', 'BULGARIAN',
		'frc CANADIAN FRENCH',
		'ca', 'CATALAN',
		'zhs', 'SIMPLIFIED CHINESE',
		'hr', 'CROATIAN',
		'cs', 'CZECH',
		'dk', 'DANISH',
		'nl', 'DUTCH',
		'eg', 'EGYPTIAN',
		'gb', 'ENGLISH',
		'et', 'ESTONIAN',
		'sf', 'FINNISH',
		'f', 'FRENCH',
		'din GERMAN DIN',
		'd', 'GERMAN',
		'el', 'GREEK',
		'iw', 'HEBREW',
		'hu', 'HUNGARIAN',
		'is', 'ICELANDIC',
		'in', 'INDONESIAN',
		'i', 'ITALIAN',
		'ja', 'JAPANESE',
		'ko', 'KOREAN',
		'esa', 'LATIN AMERICAN SPANISH',
		'lv', 'LATVIAN',
		'lt', 'LITHUANIAN',
		'ms', 'MALAY',
		'esm', 'MEXICAN SPANISH',
		'n', 'NORWEGIAN',
		'pl', 'POLISH',
		'pt', 'PORTUGUESE',
		'ro', 'ROMANIAN',
		'ru', 'RUSSIAN',
		'sk', 'SLOVAK',
		'sl', 'SLOVENIAN',
		'e', 'SPANISH',
		's', 'SWEDISH',
		'th', 'THAI',
		'zht', 'TRADITIONAL CHINESE',
		'tr', 'TURKISH',
		'uk', 'UKRAINIAN',
		'vn', 'VIETNAMESE'
	])

	function OracleDialect($, $1, $2) {
		SQLDialect.apply(this, arguments);

		if (isPlainObj($)) {
			this.__dateAndTimeFormatType_ = $.timeFormatType || $.dateFormatType || $.dateAndTimeFormatType || 'TO_DATE';
			this.__nlsDateLanguage_ = $.nlsDateLanguage || 'AMERICAN';
		} else {
			this.__dateAndTimeFormatType_ = 'TO_DATE';
			this.__nlsDateLanguage_ = 'AMERICAN';
		}
	}



	OracleDialect.prototype = new SQLDialect();

	OracleDialect.DEFAULT_OPEN_QUOTE = "'";

	OracleDialect.DEFAULT_CLAUSE_QUOTE = "'";

	OracleDialect.__CLASS__ = OracleDialect.prototype.__CLASS__ = OracleDialect;

	OracleDialect.__CLASS_NAME__ = OracleDialect.prototype.__CLASS_NAME__ = 'OracleDialect';

	OracleDialect.__SUPER__ = OracleDialect.__SUPER_CLASS__ = SQLDialect;

	var ORACLE_DEFAULT_DATE_TIME_FORMAT_DELIMITERS = '-/,.;:'.split('');

	var ORACLE_DEFAULT_DATE_TIME_FORMAT_STRING_QUOTE = '"';

	OracleDialect.DATE_TIME_FORMAT_DELIMITERS = ORACLE_DEFAULT_DATE_TIME_FORMAT_DELIMITERS;

	OracleDialect.DATE_TIME_FORMAT_STRING_QUOTE = ORACLE_DEFAULT_DATE_TIME_FORMAT_STRING_QUOTE;

	var ORACLEDATE_FORMAT_SPECIFIER_DEFS = {};

	var ORACLE_DATE_TIME_FORMAT_SPECIFIERS = (function (entries) {
		var i = 0, n = Math.floor(entries.length);
		var specifiers = [];
		var s;
		for (; i < n; i++) {
			specifiers.push(s = entries[2 * i]);
			ORACLEDATE_FORMAT_SPECIFIER_DEFS[s] = entries[2 * i + 1];
		}
		return specifiers;
	})([
		//Datetime Format Elements.',
		//'Specifier', 'Description',
		'AD', 'AD indicator without periods.',
		'A.D.', 'AD indicator with periods.',
		'AM', 'Meridian indicator without periods.',
		'A.M.', 'Meridian indicator with periods.',
		'BC', 'BC indicator without periods.',
		'B.C.', 'BC indicator with or without periods.',
		'CC', 'Century.',
		'SCC', 'Century.\nIf the last 2 digits of a 4-digit year are between 01 and 99 (inclusive), then the century is one greater than the first 2 digits of that year.\nIf the last 2 digits of a 4-digit year are 00, then the century is the same as the first 2 digits of that year.\nFor example, 2002 returns 21; 2000 returns 20.',
		'D', 'Day of week (1-7). This element depends on the NLS territory of the session.',
		'DAY', 'Name of day.',
		'DD', 'Day of month (1-31).',
		'DDD', 'Day of year (1-366).',
		'DL', 'Returns a value in the long date format, which is an extension of the Oracle Database DATE format, determined by the current value of the NLS_DATE_FORMAT parameter. Makes the appearance of the date components (day name, month number, and so forth) depend on the NLS_TERRITORY and NLS_LANGUAGE parameters. For example, in the AMERICAN_AMERICA locale, this is equivalent to specifying the format \'fmDay, Month dd, yyyy\'. In the GERMAN_GERMANY locale, it is equivalent to specifying the format \'fmDay, dd. Month \'.',
		'Restriction: You can specify this format only with the TS element, separated by white space.',
		'DS', 'Returns a value in the short date format. Makes the appearance of the date components (day name, month number, and so forth) depend on the NLS_TERRITORY and NLS_LANGUAGE parameters. For example, in the AMERICAN_AMERICA locale, this is equivalent to specifying the format \'MM/DD/RRRR\'. In the ENGLISH_UNITED_KINGDOM locale, it is equivalent to specifying the format \'DD/MM/RRRR\'.',
		'Restriction: You can specify this format only with the TS element, separated by white space.',
		'DY', 'Abbreviated name of day.',
		'E', 'Abbreviated era name (Japanese Imperial, ROC Official, and Thai Buddha calendars).',
		'EE', 'Full era name (Japanese Imperial, ROC Official, and Thai Buddha calendars).',
		'FF', 'Fractional seconds. Oracle Database uses the precision specified for the datetime data type or the data type\'s default precision. Valid in timestamp and interval formats, but not in DATE formats.',
		'FF1', 'One digit fractional seconds.',
		'FF2', 'Two digits fractional seconds.',
		'FF3', 'Threedigits fractional seconds.',
		'FF4', 'Four digits fractional seconds.',
		'FF5', 'Five digits fractional seconds.',
		'FF6', 'Six digits fractional seconds.',
		'FF7', 'Seven digits fractional seconds.',
		'FF8', 'Eight digits fractional seconds.',
		'FF9', 'Nine digits fractional seconds.\nExamples: \'HH:MI:SS.FF\nSELECT TO_CHAR(SYSTIMESTAMP, \'SS.FF3\') from DUAL;.',
		'FM', 'Returns a value with no leading or trailing blanks.\nSee Also: FM.',
		'FX', 'Requires exact matching between the character data and the format model.\nSee Also: FX.',
		'HH', 'Hour of day (1-12).',
		'HH12', 'Hour of day (1-12).',
		'HH24', 'Hour of day (0-23).',
		'IW', 'Calendar week of year (1-52 or 1-53), as defined by the ISO 8601 standard.\nA calendar week starts on Monday.\nThe first calendar week of the year includes January 4.\nThe first calendar week of the year may include December 29, 30 and 31.\nThe last calendar week of the year may include January 1, 2, and 3.',
		'IYYY', '4-digit year of the year containing the calendar week, as defined by the ISO 8601 standard.',
		'IYY', 'Last 3 digits of the year containing the calendar week, as defined by the ISO 8601 standard.',
		'IY', 'Last 2, digits of the year containing the calendar week, as defined by the ISO 8601 standard.',
		'I', 'Last digit of the year containing the calendar week, as defined by the ISO 8601 standard.',
		'J', 'Julian day; the number of days since January 1, 4712 BC. Number specified with J must be integers.',
		'MI', 'Minute (0-59).',
		'MM', 'Month (01-12; January = 01).',
		'MON', 'Abbreviated name of month.',
		'MONTH', 'Name of month.',
		'PM', 'Meridian indicator without periods.',
		'P.M.', 'Meridian indicator with periods.',
		'Q', 'Quarter of year (1, 2, 3, 4; January - March = 1).',
		'RM', 'Roman numeral month (I-XII; January = I).',
		'RR', 'Lets you store 20th century dates in the 21st century using only two digits.\nSee Also: The RR Datetime Format Element.',
		'RRRR', 'Round year. Accepts either 4-digit or 2-digit input. If 2-digit, provides the same return as RR. If you do not want this functionality, then enter the 4-digit year.',
		'SS', 'Second (0-59).',
		'SSSSS', 'Seconds past midnight (0-86399).',
		'TS', 'Returns a value in the short time format. Makes the appearance of the time components (hour, minutes, and so forth) depend on the NLS_TERRITORY and NLS_LANGUAGE initialization parameters.\nRestriction: You can specify this format only with the DL or DS element, separated by white space.',
		'TZD ', 'Daylight saving information. The TZD value is an abbreviated time zone string with daylight saving information. It must correspond with the region specified in TZR. Valid in timestamp and interval formats, but not in DATE formats.\nExample: PST (for US/Pacific standard time); PDT (for US/Pacific daylight time).',
		'TZH', 'Time zone hour. (See TZM format element.) Valid in timestamp and interval formats, but not in DATE formats.\nExample: \'HH:MI:SS.FFTZH:TZM\'.',
		'TZM', 'Time zone minute. (See TZH format element.) Valid in timestamp and interval formats, but not in DATE formats.\nExample: \'HH:MI:SS.FFTZH:TZM\'.',
		'TZR', 'Time zone region information. The value must be one of the time zone region names supported in the database. Valid in timestamp and interval formats, but not in DATE formats.\nExample: US/Pacific.',
		'WW', 'Week of year (1-53) where week 1 starts on the first day of the year and continues to the seventh day of the year.',
		'W', 'Week of month (1-5) where week 1 starts on the first day of the month and ends on the seventh.',
		'X', 'Local radix character.\nExample: \'HH:MI:SSXFF\'.',
		'Y,YYY', 'Year with comma in this position.',
		'YEAR', 'Year, spelled out.',
		'SYEAR', 'Year, spelled out; S prefixes BC dates with a minus sign (-).',
		'YYYY', '4-digit year.',
		'SYYYY', '4-digit year; S prefixes BC dates with a minus sign.',
		'YYY', 'Last 3digits of year.',
		'YY', 'Last 2 digits of year.',
		'Y', 'Last digit of year.'


	]);

	OracleDialect.DATE_TIME_FORMAT_SPECIFIERS = ORACLE_DATE_TIME_FORMAT_SPECIFIERS;

	OracleDialect.DATE_TIME_FORMAT_SPECIFIER_DEFS = ORACLEDATE_FORMAT_SPECIFIER_DEFS;

	OracleDialect.prototype.getDateAndTimeFormatType = function (lang) {
		return this.__dateAndTimeFormatType_ || (this.__dateAndTimeFormatType_ = 'AMERICA');
	};

	OracleDialect.prototype.setDateAndTimeFormatType = function (fmtType) {
		var _fmtType;
		if (!arguments.length) {
			throw new TypeError('Argument expected');
		}
		_fmtType = fmtType.toUpperCase();
		if (('TO_DATE' !== _fmtType) && ('DATE_PREFIX' !== _fmtType)) {
			throw new TypeError('Incorrect argument value: ' + fmtType);
		}
		this.__nlsDateLanguage_ = _fmtType;
		return this;
	}

	OracleDialect.prototype.getNlsDateLanguage = function (lang) {
		return this.__nlsDateLanguage_ || (this.__nlsDateLanguage_ = 'AMERICA');
	};

	OracleDialect.prototype.setNlsDateLanguage = function (lang) {
		var _lang;
		if (!arguments.length) {
			throw new TypeError('Argument expected');
		}
		_lang = lang.toUpperCase();
		if (ORACLE_NSL_DATE_LANGUAGES.indexOf(_lang) < 0) {
			_lang = ORACLE_NSL_DATE_LANG_NAMES_MAP[lang.toLowerCase()];
			if (!_lang) {
				throw new TypeError('Incorrect argument value: ' + lang);
			}
		}
		this.__nlsDateLanguage_ = _lang;
		return this;
	}
	/**
	 * Returns a string representation of generated random date value of column to use in insert query
	 * @param {*} minYear 
	 * @param {*} maxYear 
	 * @returns 
	 */
	OracleDialect.prototype.randomDate = function (minYear, maxYear) {
		var type = this.__dateAndTimeFormatType_ || 'TO_DATE';
		var strDate = this.openQuote + sqlRandomDate(minYear, maxYear) + this.closeQuote;;
		if (/^DATE_?PREFIX$/i.test(type)) {
			return "DATE '" + strDate + "'";
		} else {
			if (this.__nlsDateLanguage_ === 'AMERICAN') {
				return "TO_DATE(" + strDate + " 00:00:00, YYYY-MM-DD HH24:MI','NLS_DATE_LANGUAGE=AMERICAN')";
			}
		}
		throw new Error('Not yet supported');
	};
	/**
	 * Returns a string representation of generated random time value of column to use in insert query
	 * @param {*} type 
	 * @returns 
	 */
	OracleDialect.prototype.randomTime = function (type) {
		var dateFmt = this.__dateAndTimeFormatType_ || 'TO_DATE';
		var strDate = '1970-01-01';
		if (/^DATE_?PREFIX$/i.test(dateFmt)) {
			return "DATE '" + strDate + " " + sqlRandomTime(type) + this.closeQuote;
		} else {
			if (this.__nlsDateLanguage_ === 'AMERICAN') {
				return "TO_DATE(" + strDate + " " + sqlRandomTime(type) + this.closeQuote + + ", " + + this.openQuote + "YYYY-MM-DD HH24:MI','NLS_DATE_LANGUAGE=AMERICAN')";
			}
		}
		throw new Error('Not yet supported');
	};
	/**
	 * Returns a string representation of generated random date and time value of column to use in insert query
	 * @param {*} minYear 
	 * @param {*} maxYear 
	 * @param {*} type 
	 * @param {*} dataTimeDelim 
	 * @returns 
	 */
	OracleDialect.prototype.randomDateTime = function (minYear, maxYear, type, dataTimeDelim) {
		var dateFmt = this.__dateAndTimeFormatType_ || 'TO_DATE';
		var strDate = this.openQuote + sqlRandomDate(minYear, maxYear);
		if (/^DATE_?PREFIX$/i.test(dateFmt)) {
			return "DATE '" + strDate + " " + sqlRandomTime(type) + this.closeQuote;
		} else {
			if (this.__nlsDateLanguage_ === 'AMERICAN') {
				return "TO_DATE(" + this.openQuote + strDate + " " + sqlRandomTime(type) + this.closeQuote + ", " + + this.openQuote + "YYYY-MM-DD HH24:MI','NLS_DATE_LANGUAGE=AMERICAN')";
			}
		}
		throw new Error('Not yet supported');
	};

	Object.defineProperties(OracleDialect.prototype, {
		nlsDateLanguage: {
			get: OracleDialect.prototype.getNlsDateLanguage,
			set: OracleDialect.prototype.setNlsDateLanguage,
			enumerable: true,
			configurable: true
		},
		dateAndTimeFormatType: {
			get: OracleDialect.prototype.getDateAndTimeFormatType,
			set: OracleDialect.prototype.setDateAndTimeFormatType,
			enumerable: true,
			configurable: true
		}
	});

	function SQLLiteDialect($) {
		var x;
		SQLDialect.apply(this, arguments);
		if (isPlainObj($)) {
			x = $.dataTimeValueType || $.dataAndTimeValueType || $.dataValueType || $.imeValueType;
			if (((typeof x === 'string') && x) || (x instanceof String)) {
				this.__dataTimeValueType_ =
					(DATA_STORE__DATE_SERIAL_TYPES.indexOf(x = x.toLowerCase()) >= 0) ? x : SQLLITE__DATE_SERIAL_TYPES_MAP[x] || 'timestamp';
			} else {
				throw new TypeError('Incorrect date time value typ: ' + x);
			}
		} else {
			this.__dataTimeValueType_ = 'timestamp';
		}
	}

	SQLLiteDialect.prototype = new SQLDialect();


	SQLLiteDialect.prototype.setDateTimeValueType = function (type) {
		var _typ;
		if ((((typeof type === 'string')) || (type instanceof String))) {
			if ((DATA_STORE__DATE_SERIAL_TYPES.indexOf(_typ = type.toLowerCase()) >= 0)
				|| (_typ = SQLLITE__DATE_SERIAL_TYPES_MAP[_typ])) {
				this.__dataTimeValueType_ = _typ;
			} else if (DATA_STORE__DATE_SERIAL_TYPES.indexOf(this.__dataTimeValueType_) < 0) {
				this.__dataTimeValueType_ = 'timestamp';
			}
		} else {
			throw new TypeError('Incorrect arguments');
		}
		return this;
	};
	/**
	 * @constant
	 * @property {Object} DATE_TIME_TYPE_DATATYPES 
	 */
	SQLDialect.DATE_TIME_TYPE_DATATYPES = SQLLITE_DATE_TIME_TYPE_DATATYPES;
	/**
	 * 
	 * @returns {string} 
	 */
	SQLLiteDialect.prototype.getDateTimeValueType = function () {
		return this.__dataTimeValueType_;
	};
	function getDataTypeAffinity(dataType) {
		var typ = (dataType || '').toLowerCase();
		if (/int|byte|short|long/.test(typ)) {
			return 'INTEGER';
		}
		if (/char|text|blob|string|name|email/.test(typ)) {
			return 'TEXT';
		}
		if (/blob/.test(typ) || 'typ') {
			return 'BLOB';
		}

		if (/real|floa|doub/.test(typ) || 'typ') {
			return 'REAL';
		}

		return 'NUMERIC';
	}
	/**
	 * 
	 * @param {*} dataType 
	 * @returns {string} 
	 */
	SQLLiteDialect.getDataTypeAffinity = getDataTypeAffinity;

	SQLLiteDialect.DATE_TIME_DATA_TYPE = 'NUMERIC';

	SQLLiteDialect.DEFAULT_DATE_TIME_VALUE_TYPE = 'timestamp';
	/**
	 * Converts the given data to supported this SQL dialect store (insert or update) data type value.
	 * <p><b>Note</b>: Resulting string value are already quoted ready to use in SQL statement (insert, update, ...).</p>
	 * @param {*} val 
	 * @param {Object} column 
	 * @returns {string|number}
	 */
	SQLLiteDialect.prototype.convert = function (val, column) {
		var v;
		if (val == undefined) {
			return 'NULL';
		}
		if (val instanceof Date) {
			return sqlLiteDateTimeConverters[this.__dataTimeValueType_][(column.dataType || '').toLowerCase()](val);
		}
		if (/^bool(ean)?$/i.test(column.dataType || '')) {
			if ((val instanceof Boolean) || (val instanceof Number) || (val instanceof String)) {
				val = val.valueOf();
			}
			if (/^(boolean|number)$/.test(typeof val)) {
				return val ? 1 : 0;
			}
			if (typeof val === 'string') {
				if (/true|on|y(es)?|oui|1/.test(v = val.toLowerCase()))
					return 1;
				if (/false|off|n(on?)?|0/.test(v))
					return 0;
			}
			throw new TypeError('Incorrect boolean value: ' + val);
		}
		switch (getDataTypeAffinity(column.dataType)) {
			case 'TEXT':
				return this.openQuote + val + this.closeQuote;
			case 'BLOB':
				return this.openQuote + val + this.closeQuote;
		}
		return SQLDialect.prototype.convert.call(this, val, column);
	};
	/**
	 * 
	 * @param {*} val 
	 * @param {*} dataType 
	 * @return {Date}
	 */
	SQLLiteDialect.prototype.toDate = function (val, dataType) {
		//TODO
	};
	/**
	 * 
	 * @param {*} val 
	 * @param {*} column 
	 * @returns 
	 */
	SQLLiteDialect.prototype.toValue = function (val, column) {
		if (val == undefined)
			return null;
		var dataType = column.dataType || '';
		if (/^(date|time$)/i.test(dataType)) {
			return this.toDate(val, column.dataType);
		}
		if (/^bool(ean)?$/.test(dataType = dataType.toLowerCase())) {
			return val ? true : false;
		}
		if (dataType === 'bit') {
			return !val ? 0 : 1;
		}

		return val;
	};


	var SQLLITE_DATE_TIME_TYPES = ['timestamp', 'unix-timestamp', 'julian', 'excel', 'excel1904', 'text', 'iso8601'];

	var DATA_STORE__DATE_SERIAL_TYPES = SQLLITE_DATE_TIME_TYPES;

	var EXCEL_SERIAL_TYPE_MAPS = {
		'excelserial1904': 'excel1904',
		'excelserial1900': 'excel',
		'excel1900': 'excel',
		'excel-1900': 'excel',
		'excel-1904': 'excel1904',
		'xlsserial1904': 'excel1904',
		'xlserial1900': 'excel',
		'xls': 'excel',
		'xls-serial1904': 'excel1904',
		'xls-serial1900': 'excel',
		'xls-serial': 'excel',
	};

	var SQLLITE__DATE_SERIAL_TYPES_MAP = (function (map) {
		var name;
		for (name in EXCEL_SERIAL_TYPE_MAPS) {
			map[name] = EXCEL_SERIAL_TYPE_MAPS[name];
		}
	})({
		'unixtimestamp': 'unix-timestamp',
		'iso-3601': 'iso3601',
		'iso': 'iso3601',
		'juliandate': 'julian',
		'julian-date': 'julian',
		'julian_date': 'julian',
		'ts': 'timestamp'
	});

	var SQLLITE_DATE_TIME_TYPE_DATATYPES = {
		'timestamp': 'INTEGER',
		'time': 'INTEGER',
		'unix-timestamp': 'REAL',
		'julian': 'REAL',
		'excel': 'REAL',
		'excel1904': 'REAL',
		'text': 'TEXT',
		'iso8601': 'TEXT'
	};

	function toISO8601DateString(date, displayISOTimezone) {
		return lpad(date.getUTCFullYear(), 4)
			+ '-' + lpad(date.getUTCMonth() + 1, 2)
			+ '-' + lpad(date.getUTCDate(), 2)
			+ 'T' + lpad(date.getUTCHours(), 2)
			+ ':' + lpad(date.getUTCMinutes(), 2)
			+ ':' + lpad(date.getUTCSeconds(), 2)
			+ ':' + lpad(date.getUTCMilliseconds(), 2)
			+ (displayISOTimezone == undefined || displayISOTimezone ? 'Z' : '');
	}

	function toISO8601TimeString(date, displayISOTimezone) {
		return lpad(date.getUTCHours(), 2)
			+ ':' + lpad(date.getUTCMinutes(), 2)
			+ ':' + lpad(date.getUTCSeconds(), 2)
			+ ':' + lpad(date.getUTCMilliseconds(), 2)
			+ (displayISOTimezone == undefined || displayISOTimezone ? 'Z' : '');
	}

	var toISO8601DateTimeString = toISO8601DateString;

	function _setTime(date, type) {
		switch (type || 'hms') {
			case 'hms':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(0);
				break;
			case 'hm':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(0);
				date.setMilliseconds(0);
				break;
			case 'h':
				date.setHours(randomHour());
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0);
				break;
			case 'full':
			case 'all':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(randomMillisecond());
				break;
			default:
				throw new Error('Incorrect date time format type: ' + type);

		}
		return date;
	}
	var sqlLiteRandomDateTimes = {
		'timestamp': {
			randomDate: function (minYear, maxYear) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return (new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				)).getTime();
			},

			randomDateTime: function (minYear, maxYear, type) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return _setTime(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				), type).getTime();
			},

			randomTime: function (type) {
				return _setTime(new Date(
					1970,
					0,
					1,
					0,
					0,
					0,
					0
				), type).getTime();
			}
		},
		'unix-timestamp': {
			randomDate: function (minYear, maxYear) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return (new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				)).getTime() / 1000;
			},

			randomDateTime: function (minYear, maxYear, type) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return _setTime(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				), type).getTime() / 1000;
			},

			randomTime: function (type) {
				return _setTime(new Date(
					1970,
					0,
					1,
					0,
					0,
					0,
					0
				), type).getTime() / 1000;
			}
		},
		'iso8601': {
			randomDate: function (minYear, maxYear) {

				return "'" + toISO8601DateString(new Date(
					randomYear(minYear, maxYear),
					randomMonth() - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				)) + "'";
			},

			randomDateTime: function (minYear, maxYear, type) {
				return "'" + toISO8601DateString(_setTime(new Date(
					randomYear(minYear, maxYear),
					randomMonth() - 1,
					randomDayOfMonth(year, month),
					0, 0, 0, 0
				)), type) + "'";
			},

			randomTime: function (type) {
				return "'" + toISO8601DateString(_setTime(new Date(
					1970,
					0,
					1,
					0, 0, 0, 0
				)), type) + '"';
			}
		},
		'excel': {
			randomDate: function (minYear, maxYear) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return dateToExcel(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				));
			},

			randomDateTime: function (minYear, maxYear, type) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return dateToExcel(_setTime(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0, 0, 0, 0
				), type));
			},

			randomTime: function (type) {
				return dateToExcel(_setTime(new Date(
					1970,
					0,
					1,
					0, 0, 0, 0
				), type));
			}
		},
		'excel1904': {
			randomDate: function (minYear, maxYear) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return dateToExcel(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0,
					0,
					0,
					0
				), true);
			},

			randomDateTime: function (minYear, maxYear, type) {
				var year = randomYear(minYear, maxYear);
				var month = randomMonth();
				return dateToExcel(_setTime(new Date(
					year,
					month - 1,
					randomDayOfMonth(year, month),
					0, 0, 0, 0
				), type), true);
			},

			randomTime: function (type) {
				return dateToExcel(_setTime(new Date(
					1970,
					0,
					1,
					0, 0, 0, 0
				), type), true);
			}
		}

	};

	var sqlLiteDateTimeConverters = {
		'timestamp': {
			date: function (date) {
				return _toDate(date).getTime();
			},

			datetime: function (date) {
				return date.getTime();
			},

			time: function (date) {
				return _toTime(date).getTime();
			}
		},
		'unix-timestamp': {
			date: function (date) {
				return _toDate(date).getTime() / 1000;
			},

			datetime: function (date) {
				return date.getTime() / 1000;
			},

			time: function (date) {
				return _toTime(date).getTime() / 1000;
			}
		},
		'iso8601': {
			date: function (date) {

				return "'" + toISO8601DateString(_toDate(date)) + "'";
			},

			datetime: function (date) {
				return "'" + toISO8601DateString(date) + "'";
			},

			time: function (type) {
				return "'" + toISO8601DateString(_toTime(date)) + '"';
			}
		},
		'excel': {
			date: function (date) {
				return dateToExcel(_toDate(date));
			},

			datetime: function (date) {
				return dateToExcel(date);
			},

			time: function (type) {
				return dateToExcel(_toTime(date));
			}
		},
		'excel1904': {
			date: function (date) {
				return dateToExcel(_toDate(
					date
				), true);
			},

			datetime: function (date) {
				return dateToExcel(date, true);
			},

			time: function (date) {
				return dateToExcel(_toTime(date), true);
			}
		}

	};

	sqlLiteRandomDateTimes.time = sqlLiteRandomDateTimes.timestamp;

	sqlLiteRandomDateTimes.xls = sqlLiteRandomDateTimes.excel;

	sqlLiteRandomDateTimes.xls1904 = sqlLiteRandomDateTimes.excel1904;

	var stringToDateTimeConverters = {
		'timestamp': {
			date: function (date) {
				return new Date(parseInt(date, 10));
			},

			datetime: function (date) {
				return new Date(parseInt(date, 10));
			},

			time: function (date) {
				return new Date(parseInt(date, 10));
			}
		},
		'unix-timestamp': {
			date: function (date) {
				return new Date(parseFloat(date, 10)*1000);
			},

			datetime: function (date) {
				return new Date(parseFloat(date, 10)*1000);
			},

			time: function (date) {
				return new Date(parseFloat(date, 10)*1000);
			}
		},
		'iso8601': {
			date: function (date) {

				return new Date(date);
			},

			datetime: function (date) {
				return new Date(date);
			},

			time: function (type) {
				return new Date(date);
			}
		},
		'excel': {
			date: function (date) {
				return excelToDate(parseFloat(date));
			},

			datetime: function (date) {
				return excelToDate(parseFloat(date));
			},

			time: function (type) {
				return excelToDate(parseFloat(date));
			}
		},
		'excel1904': {
			date: function (date) {
				return excelToDate(parseFloat(date), true);
			},

			datetime: function (date) {
				return excelToDate(parseFloat(date), true);
			},

			time: function (type) {
				return excelToDate(parseFloat(date), true);
			}
		}
	};

	SQLLiteDialect.prototype.randomDate = function (minYear, maxYear) {
		return sqlLiteRandomDateTimes[this.__dataTimeValueType_].randomDate(minYear, maxYear);
	};

	SQLLiteDialect.prototype.randomDateTime = function (minYear, maxYear, type) {
		return sqlLiteRandomDateTimes[this.__dataTimeValueType_].randomDateTime(minYear, maxYear, type);
	};

	SQLLiteDialect.prototype.randomDateTime = function (type) {
		return sqlLiteRandomDateTimes[this.__dataTimeValueType_].randomTime(type);
	};
	/**
	 * 
	 * @class DataDialect
	 */
	function DataDialect() {
		this.openQuote = "";
		this.closeQuote = "";
		ADataDialect.apply(this, arguments);
		//TODO
	}

	DataDialect.prototype = new ADataDialect();

	DataDialect.prototype.__CLASS__ = DataDialect.__CLASS__ = DataDialect;

	DataDialect.prototype.__CLASS_NAME__ = DataDialect.__CLASS_NAME__ = 'DataDialect';

	DataDialect.__SUPER__ = DataDialect.__SUPER_CLASS__ = ADataDialect;

	DataDialect.EXCEL_BOM = EXCEL_BOM;

	DataDialect.prototype.stringValue = function (str) {
		return str;
	};
	DataDialect.prototype.dateValue = function (date) {
		return date;
	};

	DataDialect.prototype.dateTimeValue = function (dateTime) {
		return dateTime;
	};

	DataDialect.prototype.timeValue = function (time) {
		return time;
	};

	DataDialect.prototype.randomDate = function (minYear, maxYear) {
		var year = randomYear(minYear, maxYear);
		var month = randomMonth();
		return new Date(
			year,
			month - 1,
			randomDayOfMonth(year, month),
			0,
			0,
			0,
			0
		);
	};

	DataDialect.prototype.randomTime = function (type, date) {
		if (!date) {
			date = new Date(timeBaseDate);
		}
		switch (type || 'hms') {
			case 'hms':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(0);
				return date;
			case 'hm':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(0);
				date.setMilliseconds(0);
				return date;
			case 'h':
				date.setHours(randomHour());
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0);
				return date;
			case 'full':
			case 'all':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(randomMillisecond());
				return date;
			default:
				throw new Error('Incorrect date time format type: ' + type);
		}
	};

	DataDialect.randomDateTime = function (minYear, maxYear, type) {
		return this.randomTime(type, this.randomDate(minYear, maxYear));
	};

	globalNS.DataDialect = DataDialect;

	var CSV_ACCEPTED_DELIMS_RE = /[,;\|\t :]/;

	var CSV_ACCEPTED_QUOTES_RE = /["'`]/;

	var CSV_ACCEPTED_STRICT_QUOTES_RE = /"/;

	var EXPAND_NESTED_OBJECTS = 1;

	var EXPAND_ARRAY_OBJECTS = 2;

	var EXPAND_NESTED_AND_ARRAY_OBJECTS = 3;

	var NO_VALUE_EXPANSION = 0;

	function _setPrimaryDataTypeStringValuesQuotes($,self) {
		var x = coalesce($, ['primaryDataTypeStringValuesQuotes', 'allowPrimaryDataTypeStringValuesQuote', 'allowPrimaryDataTypeStringValuesQuotes']);
		if ((x === 0) || (x === false)) {
			self.__primaryDataTypeStringValuesQuotes_ = 0;
			self.__alwaysQuoteUndefinedStringValues_ = false;
			self.__alwaysQuoteNullStringValues_ = false;
			self.__alwaysQuoteNumberStringValues_ = false;
			self.__alwaysQuoteBooleanStringValues_ = false;
		}else if (x === true) {
			self.__primaryDataTypeStringValuesQuotes_ = 10;
			self.__alwaysQuoteUndefinedStringValues_ = true;
			self.__alwaysQuoteNullStringValues_ = true;
			self.__alwaysQuoteNumberStringValues_ = true;
			self.__alwaysQuoteBooleanStringValues_ = true;
		} else if ((typeof x === 'number') && x >= 0) {
			self.__primaryDataTypeStringValuesQuotes_ = x > 10 ? 10 : x >= 6 ? 6 : x >= 3 ? 3 : x > 0 ? 1 : 0;
			self.__alwaysQuoteUndefinedStringValues_ = x == 0 ? false : true;
			self.__alwaysQuoteNullStringValues_ = x >= 3;
			self.__alwaysQuoteNumberStringValues_ = x >= 6;
			self.__alwaysQuoteBooleanStringValues_ = x >= 10;
		} else {
			self.__primaryDataTypeStringValuesQuotes_ = 0;
			x = $.alwaysQuoteUndefinedStringValues ? 1: 0;
			self.alwaysQuoteUndefinedStringValues = !!x;
			self.__primaryDataTypeStringValuesQuotes_ += x;

			x = $.__alwaysQuoteNullStringValues_ ? 2: 0;
			self.__alwaysQuoteNullStringValues_ = !!x;
			self.__primaryDataTypeStringValuesQuotes_ += x

			x = $.alwaysQuoteNumberStringValues ? 3: 0;
			self.__alwaysQuoteNumberStringValues_ = !!x;
			self.__primaryDataTypeStringValuesQuotes_ += x

			x = $.alwaysQuoteBooleanStringValues ? 4: 0;
			self.__alwaysQuoteBooleanStringValues_ = !!x;
			self.__primaryDataTypeStringValuesQuotes_ += x
		}
	}

	function _setPathTokenizers($, self) {
		var nestedDelim;
		self.__refDelim_ = coalesce($, ['pathDelim', 'pathDelimiter', 'pathSeparator']);
		self.__refOpener_ = coalesce($, ['refOpener', 'refOpenSymbol', 'refOpenChar', 'pathTokenOpener', 'pathTokenOpenSymbol', 'pathTokenOpenChar']);
		self.__refCloser_ = coalesce($, ['refCloser', 'refCloseSymbol', 'refCloseChar', 'pathTokenCloser', 'pathTokenCloseSymbol', 'pathTokenCloseChar']);
		self.__indexOpener_ = coalesce($, ['indexOpener', 'indexOpenSymbol', 'indexOpenChar']);
		self.__indexCloser_ = coalesce($, ['indexCloser', 'indexCloseSymbol', 'indexCloseChar']);

		if (!self.__refDelim_ && !self.__refOpener_ && !self.__refCloser_ && !self.__indexOpener_ && !self.__indexCloser_) {
			nestedDelim = coalesce($, [
				'nestedDelim', 'nestedDelimiter', 'nestedSeparator', 'nestDelim', 'nestDelimiter', 'nestSeparator',
				'flattenDelim', 'flattenDelimiter', 'flattenSeparator', 'flatDelim', 'flatDelimiter', 'flatSeparator'
			]);
			if (!(self.__nestedDelim_ = nestedDelim)) {
				if (self.__expandNestedObjects_) {
					self.__refDelim_ = '.';
					self.__refOpener_ = self.__refCloser_ = '';
				}
				if (self.__expandArrayObjects_) {
					self.__refOpener_ = '[';
					self.__refCloser_ = ']';
				}
			}
		}
	}

	/**
	 * 
	 * @class CSVDialect
	 */
	var CSVDialect = def(this, 'CSVDialect', function CSVDialect($) {
		var x;
		var eol, qe;
		ADataDialect.apply(this, arguments);
		this.__quoteEscapeChar_ = '"';
		this.__quoteEscaper_ = 'quote';
		this.__escapeLineBreak_ = false;
		if (isPlainObj($)) {
			this.___allowOnlyDoubleQuoteEnclosing__ = toBool(coalesce($, [
				'doubleQuoteEnclosing', 'onlyDoubleQuoteEnclosing', 'doubleQuoteEnclosingOnly',
				'allowOnlyDoubleQuoteEnclosing', 'allowDoubleQuoteEnclosingOnly',
				'strictQuoting', 'strictEnclosing'
			], false));
			
			x = coalesce($, ['escapeLineFeed', 'lineFeedEscape', 'escapeLineBreak', 'lineBreakEscape']);
			if (x != undefined) {
				this.__escapeLineBreak_ = toBool(x);
			}
			this.openQuote = this.___allowOnlyDoubleQuoteEnclosing__ ? '"' : $.quote || $.openQuote || $.closeQuote || $.encloser || '"';
			x = $.delim || $.delimiter || $.separator || $.fieldDelim || $.fieldDelimiter || $.fieldSeparator 
					||$.delims || $.delimiters || $.separators || $.fieldDelims || $.fieldDelimiters || $.fieldSeparators;
			if (x instanceof String) {
				x = x.valueOf();
			}
			if (isPlainObj(x)) {
				this.delim = x.field||x.column||x.delim || x.delimiter || x.separator || x.fieldDelim 
						|| x.fieldDelimiter || x.fieldSeparator || x.columnDelimiter || x.columnSeparator||',';
				eol = coalesce(x, ['lineBreak', 'eol', 'endOfLine', 'lineFeed']);
				qe = x.quoteEscaper || x.quoteEscaperChar || x.quoteEscapeChar || x.quoteEscape
						|| x.encloserEscaper || x.encloserEscaperChar || x.encloserEscapeChar || x.encloserEscape
						|| x.encloseEscaper || x.encloseEscaperChar || x.encloseEscapeChar || x.encloseEscape;
			} else {
				this.delim = x||',';
			}
			x = $.quoteEscaper || $.quoteEscaperChar || $.quoteEscapeChar || $.quoteEscape
				|| $.encloserEscaper || $.encloserEscaperChar || $.encloserEscapeChar || $.encloserEscape
				|| $.encloseEscaper || $.encloseEscaperChar || $.encloseEscapeChar || $.encloseEscape||qe;
			if (x)
				this.quoteEscaper = x;
			this.setLineBreak(coalesce($, [
				'lineBreak', 'eol', 'endOfLine', 'lineFeed', 
				'redordDelim' , 'recordDelimiter', 'record_delimiter', 'record_delim',
				'rowDelim' , 'rowDelimiter', 'row_delimiter', 'row_delim'
			], eol||'\n'));
			this.__preventCSVInjection_ = coalesce($, ['preventCSVInjection', 'preventCsvInjection', 'preventFormulaInjection', 'escapeFormulas', 'escape_formulas', 'escapedFormulas', 'escaped_formulas'], false);
			this.__preventCSVInjectionEscaper_ = coalesce($, [
				'preventCSVInjectionEscaper', 'preventCSVInjectionEscapeChar',
				'preventCsvInjectionEscaper', 'preventCsvInjectionEscapeChar',
				'escapeFormulasChar', 'escape_formulas_char', 'escapedFormulasChar', 'escaped_formulas_char',
				'escapeFormulaChar', 'escape_formula_char', 'escapedFormulaChar', 'escaped_formula_char'
			], this.__preventCSVInjection_ ? "'" : '');
			this.__allowValueQuoting_ = toBool(coalesce($, ['allowValueQuoting', 'acceptValueQuoting', 'supportValueQuoting', 'supportsValueQuoting',
				'allowValueQuote', 'acceptValueQuote', 'supportValueQuote', 'supportsValueQuote', 'enclosedValues'], true));
			this.__quoteAllValues_ = toBool(coalesce($, [
				'quoteAllValues', 'allowQuoteAllValues', 'acceptQuoteAllValues', 'supportQuoteAllValues', 'supportsQuoteAllValues', 'alwaysQuote', 'enclosedAllValues',
				'quoteAllFields', 'allowQuoteAllFields', 'acceptQuoteAllFields', 'supportQuoteAllFields', 'supportsQuoteAllFields', 'enclosedAllFields'
			], false));
			this.__quoteAllStringValues_ = toBool(coalesce($, ['quoteAllStringValues', 'quoteAllStrings', 'quoteStrings', 'quoteAllTextValues', 'quoteAllTexts', 'alwaysQuoteString', 'alwaysQuoteString', 'stringAlwaysQuoted', 'alwaysQuoteStrings', 'stringsAlwaysQuoted']));
			this.__acceptUnicode_ = toBool(coalesce($, ['allowUnicode', 'acceptUnicode', 'supportUnicode', 'supportsUnicode'], false));
			this.dateFormat = $.dateFormat || 'iso8601';
			this.timeFormat = $.timeFormat || 'iso8601-time';
			this.explicitQuotedColumns = $.explicitQuotedColumns || $.definedQuotedColumns || $.quotedColumns || [];
			this.__shouldWriteHeaders_ = toBool(coalesce($, [
						'shouldWriteHeaders', 'writeHeaders',
						'hasHeader', 'hasHeaders', 'withHeader', 'withHeaders',
						'prependHeader', 'prependHeaders'
					], 
					!toBool(coalesce($, [
						'noheader', 'noheaders', 'noHeader', 'noHeaders', 'withoutHeader', 'withoutHeaders',
						'dataOnly', 'onlyData'
					], false))));
			this.__shouldFormatColumns_ = toBool(coalesce($, ['shouldFormatColumns', 'formatColumns'], true));
			this.__shouldLastRecordHasLineBreak_ = toBool(coalesce($, ['shouldLastRecordHasLineBreak', 'lastRecordHasLineBreak', 'lastRecordWithLineBreak'], false));
			this.__noValueWithDelimiterChar_ = toBool(coalesce($, [
				'noValueWithDelimiterChar', 'noValueWithSeparatorChar', 'noValueWithDelimChar',
				'noDelimiterInValue', 'noSeparatorInValue', 'noDelimInValue',
				'noValueWithCommaChar', 'noCommaInValue'
			], false));

			this.__noValueWithQuoteChar_ = toBool(coalesce($, [
				'noValueWithQuoteChar', 'noValueWithEncloserChar', 'noValueWithQuoteCharacter', 'noValueWithQuoteCharacters',
				'noQuoteInValue', 'noEncloserInValue', 'noValueWithEncloserCharacter', 'noValueWithEncloserCharacters',
				'noValueWithEncloserChar', 'noEncloserInValue', 'noNestedQuotes'
			], !toBool(coalesce($, ['nestedQuotes', 'valueWithQuoteChar', 'valueWithEncloserChar', 'valueWithQuoteCharacter', 
				'valueWithQuoteCharacters', 'noQuoteInValue', 'noEncloserInValue', 'valueWithEncloserCharacter', 
				'valueWithEncloserCharacters', 'valueWithEncloserChar', 'noEncloserInValue'],  true))));

			if ($.displayISOTimezone != undefined) {
				this.__this.__displayISOTimezone_ = toBool($.displayISOTimezone);
			}
			x = $.dataTimeValueType || $.dataAndTimeValueType || $.dataValueType || $.imeValueType;
			if (((typeof x === 'string') && x) || (x instanceof String)) {
				this.__dataTimeValueType_ =
					(DATA_STORE__DATE_SERIAL_TYPES.indexOf(x = x.toLowerCase()) >= 0) ? x : SQLLITE__DATE_SERIAL_TYPES_MAP[x] || 'timestamp';
			} else {
				this.__dataTimeValueType_ = 'base';
			}
			this.__acceptMultiLineValues_ = toBool(coalesce($, [
				'acceptMultiLineValues', 'acceptLineBreaksInValues',
				'allowMultiLineValues', 'allowLineBreaksInValues',
				'supportMultiLineValues', 'supportLineBreaksInValues',
			], false));
			x = coalesce($, ['emptyValueEncloser', 'emptyValueWraper', 'emptyValueWrapper'], '');
			this.__emptyValueOpenEncloser_ = coalesce($, ['emptyValueOpenEncloser', 'emptyValueOpenWraper', 'emptyValueOpenWrapper'], x);
			this.__emptyValueCloseEncloser_ = coalesce($, ['emptyValueClosecloser', 'emptyValueCloseWraper', 'emptyValueCloseWrapper'], x ? x : this.__emptyValueOpenEncloser_);
			this.__encloseEmptyValue_ = toBool(coalesce($, ['encloseEmptyValue', 'wrapEmptyValue'], this.__emptyValueOpenEncloser_ ? true : false));
			this.__escapeHeaderNestedDelims_ = toBool(coalesce($,['escapeHeaderNestedDelims', 'escapeHeaderNestedDelimiters', 'escapeHeaderNestedDots', 'escapeHeaderNestedSeparators' ]));
			this.__withBOM_ = toBool(coalesce($, ['withBOM', 'writeBOM', 'excelBOM', 'xlsBOM', 'bom'], false));
    		_setPathTokenizers($, this);
			if ((x = coalesce($, [
					'multiValuesFieldExpansion', 'multiValuesFieldExpand',
					'multiValueFieldExpandType', 'multiValueFieldExpansionType',
					'multiValuesFieldExpandType', 'multiValuesFieldExpansionType',
					'multiValueFieldExpand', 'multiValueFieldExpansion',
					'fieldMultiValueExpandType', 'fieldMultiValueExpansionType',
					'fieldMultiValuesExpandType', 'fieldMultiValuesExpansionType',
					'expandMultiValueObjects', 'expandMultiValuesObjects', 
					'explodeMultiValueObjects', 'explodeMultiValuesObjects',
					'flat', 'flatten', 'nested',
			])) != undefined) {
				this.setMultiValuesFieldExpansion(x);
			} else {
				this.__expandNestedObjects_ = toBool(coalesce($, ['expandNestedObjects', 'explodeNestedObjects'], this.__refDelim_ ? true : false));
				this.__expandArrayObjects_ = toBool(coalesce($, ['expandArrayObjects', 'expandArrays', 'expandNestedArrays', 'expandArray', 'explodeArrayObjects', 'explodeArrays', 'explodeNestedArrays', 'explodeArray'], this.__indexOpener_ ? true : false));
				this.__multiValuesFieldExpansion_ = (this.__expandNestedObjects_ ? EXPAND_NESTED_OBJECTS : 0)
														+ (this.__expandArrayObjects_ ? EXPAND_ARRAY_OBJECTS : 0);
			}
			x = coalesce($, [
				'quoteEmptyStringValue', 'quotedEmptyStringValue', 
				'quoteEmptyStringsValue', 'quotedEmptyStringsValue',
				'alwaysQuoteEmptyStringValue', 'alwaysQuotedEmptyStringValue', 
				'alwaysQuoteEmptyStringsValue', 'alwaysQuotedEmptyStringsValue'
			]);
			if (x != undefined)
				this.__quoteEmptyStringValue_ = toBool(x);

			this.__emptyStringValue_ = $.emptyStringValue;
			this.__emptyQuotedStringValue_ = $.emptyQuotedStringValue;
			this.__emptyStringBooleanValue_ = $.emptyStringBooleanValue;
			//is the string representation of a boolean caseless ( case insensitive) or is the string reprsentation case sensitive?
			this.__booleanCaselessStringValues_ = toBool(coalesce($, [
					'booleanCaselessStringValues', 'booleanCaselessStringValue', 'booleanNoCaseStringValues', 'booleanNoCaseStringValue',
					'boolCaselessStringValues', 'boolCaselessStringValue', 'boolNoCaseStringValues', 'boolNoCaseStringValue'
				],
				!toBool(coalesce($, [
					'booleanCaseSensitiveStringValues', 'booleanCaseSensitiveStringValue', 'booleanCasesensitiveStringValues', 'booleanCasesensitiveStringValue',
					'boolCaseSensitiveStringValues', 'boolCaseSensitiveStringValue', 'boolCasesensitiveStringValues', 'boolCasesensitiveStringValue'
				], true))
			));

			//is the string representation of a undefined caseless ( case insensitive) or is the string reprsentation case sensitive?
			this.__undefinedCaselessStringValues_ = toBool(coalesce($, [
					'undefinedCaselessStringValues', 'undefinedCaselessStringValue', 'undefinedNoCaseStringValues', 'undefinedNoCaseStringValue'
				],
				!toBool(coalesce($, [
					'undefinedCaseSensitiveStringValues', 'undefinedCaseSensitiveStringValue', 'undefinedCasesensitiveStringValues', 'undefinedCasesensitiveStringValue'
				], true))
			));

			//is the string representation of a null caseless ( case insensitive) or is the string reprsentation case sensitive?
			this.__nullCaselessStringValues_ = toBool(coalesce($, [
					'nullCaselessStringValues', 'nullCaselessStringValue', 'nullNoCaseStringValues', 'nullNoCaseStringValue'
				],
				!toBool(coalesce($, [
					'nullCaseSensitiveStringValues', 'nullCaseSensitiveStringValue', 'nullCasesensitiveStringValues', 'nullCasesensitiveStringValue'
				], true))
			));

			//string representation of true value
			this.__trueStringValue_ = $.trueStringValue||'true';
			//string representation of false value
			this.__falseStringValue_ = $.falseStringValue||'false';
			//string representation of undefined value
			this.__undefinedStringValue_ = $.undefinedStringValue||'';
			//string representation of null value
			this.__nullStringValue_ = $.nullStringValue||'';

			_setPrimaryDataTypeStringValuesQuotes($, this);

			this.__alwaysQuoteEmptyStringValue_ = toBool(coalesce($, ['alwaysQuoteEmptyStringValue', 'quoteEmptyStringValue'], true));
			//set expansion options that are not setted depending of the value of this.__expandNestedObjects_ and this.__expandArrayObjects_
			this.setExpansionOptions();
			this.__arrayValueFieldPrefix_ = $.arrayValueFieldPrefix||$.arrayValFieldPrefix||$.arrayValuePrefix||$.arrayValPrefix||'$';
		} else { //set default options
			this.__multiValuesFieldExpansion_ = 0;
			this.__expandArrayObjects_ = false;
			this.__expandNestedObjects_ = false;
			this.__refDelim_ = '';
			this.__refOpener_ = this.__refCloser_ = '';
			this.__indexOpener_ = this.__indexCloser_ = '';
			this.___allowOnlyDoubleQuoteEnclosing__ = false;
			this.__openQuote_ = this.__closeQuote_ = '"';
			this.__delim_ = ',';
			this.__lineBreak_ = '\n';
			this.allowValueQuoting = true; //quote automatically values that has delimiter, line break and/or quote
			this.__quoteAllValues_ = false;
			this.__quoteAllStringValues_ = false;
			this.__quoteEmptyStringValue_ = false;
			this.__noValueWithDelimiterChar_ = false;
			this.__noValueWithQuoteChar_ = false;
			this.acceptUnicode = false;
			this.dateFormat = 'iso8601';
			this.timeFormat = 'iso8601-time';
			this.__explicitQuotedColumns_ = [];
			this.__shouldLastRecordHasLineBreak_ = false;
			this.__shouldWriteHeaders_ = true;
			this.__emptyFieldValue_ = '';
			this.__encloseEmptyValue_ = false;
			this.__emptyValueOpenEncloser_ = '';
			this.__emptyValueCloseEncloser_ = '';
			this.__escapeHeaderNestedDelims_ = false;
			this.__withBOM_ = false;
			this.__arrayValueFieldPrefix_ = '$';
			this.__preventCSVInjection_ = false;
			this.__preventCSVInjectionEscaper_ = "'";
			this.__trueStringValue_ = 'true';
			this.__falseStringValue_ = 'false';
			this.__undefinedStringValue_ = '';
			this.__nullStringValue_ = '';
			this.__alwaysQuoteNullStringValues_ = true;
			this.__alwaysQuoteUndefinedStringValues_ = true;
			this.__alwaysQuoteNumberStringValues_ = true;
			this.__alwaysQuoteBooleanStringValues_ = true;
			this.__alwaysQuoteEmptyStringValue_ = true;
			this.__primaryDataTypeStringValuesQuotes_ = 10;
			this.__booleanCaselessStringValues_ = false;
			this.__nullCaselessStringValues_ = false;
			this.setAutoEnclosedRegexp();
		}
		this.__delimRegexp__ = new RegExp(regexEscape(this.__delim_), "g");
		this.setValueStringifier();
	});


	CSVDialect.prototype = new ADataDialect();

	CSVDialect.prototype.__CLASS__ = CSVDialect.__CLASS__ = CSVDialect;

	CSVDialect.prototype.__CLASS_NAME__ = CSVDialect.__CLASS_NAME__ = 'CSVDialect';

	CSVDialect.__SUPER__ = CSVDialect.__SUPER_CLASS__ = ADataDialect;

	CSVDialect.EXCEL_BOM = EXCEL_BOM;
	/**
	 * Returns the value that specifies how to transform complex values (arrays or objects) of Multi values fields.
	 * @returns {0|1|2|3} Possible values returned.
	 *   <p>Below the signification of returned value:</p>
	 *   <ul>
	 *     <li><em style="color:navy;">0</em>: Values of Multi values fields are not expanded but transformed to JSON string.</li>
	 *     <li><em style="color:navy;">1</em>: Only values of nested objects multi values fields are expanded and array objects are transformed to JSON string.</li>
	 *     <li><em style="color:navy;">2</em>: Only values of array objects multi values fields are expanded and nested objects are transformed to JSON string.</li></li>
	 *     <li><em style="color:navy;">3</em>: Both nested objects  and array objects are expanded</li>
	 *   </ul>
	 */
	CSVDialect.prototype.getMultiValuesFieldExpansion = function() {
		return this.__multiValuesFieldExpansion_;
	};
	var expandBothRe = /^(?:both|all|full|nested-?objects?\+(?:arrays?(?:-?objects?)?|nested-?arrays?(?:-?objects?)?)|(arrays?(-?objects?)?|nested-?arrays?(-?objects?)?)\+nested-?objects?)$/;
	/**
	 * Sets the value of multi values expansion field/property and returns this dialect. When multivalues transformation is allowed, one expandable field (nested object or array objec)t is transformed to one or many CSV fields (columns).
	 * @param {number|boolean|string} x MultiValuesFieldExpansion argument: complex (multi) values expansion or transformation policy
	 *   <h4>Number values</h4>
	 *   <p>Below the expected number values:</p>
	 *   <ul>
	 *     <li><em style="color:navy;">0</em>: Values of Multi values fields are not expanded but transformed to JSON string.</li>
	 *     <li><em style="color:navy;">1</em>: Only values of nested objects multi values fields are expanded and array objects are transformed to JSON string.</li>
	 *     <li><em style="color:navy;">2</em>: Only values of array objects multi values fields are expanded and nested objects are transformed to JSON string.</li></li>
	 *     <li><em style="color:navy;">3</em>: </li>
	 *   </ul>
	 *   <p>Number value less than 0 is assimilated to 0 and number value greater than 3 is assimilated to 3.
	 *   <h4>Boolean values</h4>
	 * 	 <p>False value is assimilated to 0 and true value assimilated to 3.</p>
	 *   <h4>String values</h4>
	 * @returns {SereniX.data.CSVDialect}
	 */
	CSVDialect.prototype.setMultiValuesFieldExpansion = function(x) {
		var typ;
		x = arguments.length === 0 ? true : unboxVal(x);
		if ((typ = typeof x) === 'number') {
			if (x <= NO_VALUE_EXPANSION) {
				this.__expandArrayObjects_ = this.__expandNestedObjects_ = false;
				this.__multiValuesFieldExpansion_ = 0;
			} else if (x === EXPAND_NESTED_OBJECTS) {
				this.__expandNestedObjects_ = true;
				this.__expandArrayObjects_ = false;
				this.__multiValuesFieldExpansion_ = x;
			}  else if (x === EXPAND_ARRAY_OBJECTS) {
				this.__expandNestedObjects_ = false;
				this.__expandArrayObjects_ = true;
				this.__multiValuesFieldExpansion_ = x;
			} else { //if (x === EXPAND_NESTED_AND_ARRAY_OBJECTS)
				this.__expandArrayObjects_ = this.__expandNestedObjects_ = true;
				this.__multiValuesFieldExpansion_ = EXPAND_NESTED_AND_ARRAY_OBJECTS;
			}
		} else if (typ === 'boolean') {
			this.__expandArrayObjects_ = this.__expandNestedObjects_ = x;
			this.__multiValuesFieldExpansion_ = x ? EXPAND_NESTED_AND_ARRAY_OBJECTS : NO_VALUE_EXPANSION;
		} else if (isPlainObj(x)) {
			this.__expandNestedObjects_ = toBool(coalesce(x, ['objects', 'object'], false));
			this.__expandArrayObjects_ = toBool(coalesce(x, ['arrays', 'array'], false));
		} else if (Array.isArray(x)) {
			this.__expandNestedObjects_ = toBool(x[0]);
			this.__expandArrayObjects_ = toBool(x.length > 1 ? x[1] : x[0]);
		}  else if (/^nested-?objects?$/.test(x = x.toLowerCase())) {
			this.__expandNestedObjects_ = true;
			this.__expandArrayObjects_ = false;
			this.__multiValuesFieldExpansion_ = EXPAND_NESTED_OBJECTS;
		} else if (/^(arrays?(-?objects?)?|nested-?arrays?(?:-?objects?)?)$/.test(x)) {
			this.__expandNestedObjects_ = false;
			this.__expandArrayObjects_ = true;
			this.__multiValuesFieldExpansion_ = EXPAND_ARRAY_OBJECTS;
		} else {
			this.__expandArrayObjects_ = this.__expandNestedObjects_ = expandBothRe.test(x) ? true : toBool(x);
			this.__multiValuesFieldExpansion_ = this.__expandArrayObjects_ ? EXPAND_NESTED_AND_ARRAY_OBJECTS : NO_VALUE_EXPANSION;
		}
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.isExpandNestedObjects = function() {
		return this.__expandNestedObjects_;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.getExpandNestedObjects = CSVDialect.prototype.isExpandNestedObjects;
	/**
	 * 
	 * @param {*} [expand=true] 
	 * @returns 
	 */
	CSVDialect.prototype.setExpandNestedObjects = function(expand) {
		this.__expandNestedObjects_ = arguments.length ? toBool(unboxVal(expand)) : true;
		this.__multiValuesFieldExpansion_ = (!this.__expandNestedObjects_ ? 0 : EXPAND_NESTED_OBJECTS)
														+ (!this.__expandArrayObjects_ ? 0 : EXPAND_ARRAY_OBJECTS);
		return this;
	};
	/**
	 * 
	 * @returns {boolean}
	 */
	CSVDialect.prototype.isExpandArrayObjects = function() {
		return this.__expandNestedObjects_;
	};
	/**
	 * 
	 * @alias CSVDialect.prototype.isExpandArrayObjects
	 */
	CSVDialect.prototype.getExpandArrayObjects = CSVDialect.prototype.isExpandArrayObjects;
	/**
	 * 
	 * @param {*} [expand=true] 
	 * @returns 
	 */
	CSVDialect.prototype.setExpandArrayObjects = function(expand) {
		this.__expandArrayObjects_ = arguments.length ? toBool(unboxVal(expand)) : true;
		this.__multiValuesFieldExpansion_ = (!this.__expandNestedObjects_ ? 0 : EXPAND_NESTED_OBJECTS)
														+ (!this.__expandArrayObjects_ ? 0 : EXPAND_ARRAY_OBJECTS);
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.setExpansionOptions = function() {
		if (this.__nestedDelim_)
			return;
		if (this.__expandNestedObjects_) {
			if ((this.__refDelim_ == undefined) && (this.__refOpener_ == undefined)) {
				this.__refDelim_ = '.';
				this.__refOpener_ = this.__refCloser_ = '';
			} else if (this.__refOpener_) {
				if (!this.__refDelim_)
					this.__refDelim_ = '';
				if (!this.__refCloser_)
					this.__refCloser_ = '';
			} else if (this.__refCloser_) {
				if (!this.__refDelim_)
					this.__refDelim_ = '';
				if (!this.__refOpener_)
					this.__refOpener_ = '';
			}
		}

		if (this.__expandArrayObjects_ && (!this.__indexOpener_ && !this.__indexCloser_)) {
			this.__indexOpener_ = '[';
			this.__indexCloser_ = ']';
		}
		return this;
	};
	/**
	 * Returns the prefix to use to write header fields (columns) when transforming array to CSV string or the prefix to use to write header fields (columns) when parsing CSV string to array of arrays.
	 * <p>This value is ueful when transforming array of arrays data.</p>
	 * @returns {string}
	 */
	CSVDialect.prototype.getArrayValueFieldPrefix = function() {
		return this.__arrayValueFieldPrefix_||(this.__arrayValueFieldPrefix_ = '$');
	};
	/**
	 * Sets  the prefix to use to write header fields (columns) when transforming array to CSV string or the prefix to use to write header fields (columns) when parsing CSV string to array of arrays.
	 * @param {string} pref 
	 * @returns {SereniX.data.CSVDialect}
	 */
	CSVDialect.prototype.setArrayValueFieldPrefix = function(pref) {
		if (arguments.length) {
			this.__arrayValueFieldPrefix_ = '' + pref;
		} else if (!this.__arrayValueFieldPrefix_) {
			this.__arrayValueFieldPrefix_ = '$';
		}
		return this;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.setQuoteEscaper - function (quoteEscaper) {
		this.__quoteEscaper_ = quoteEscaper;
	};

	var defaultQuoteEscaper = 'quote';
	/**
	 * 
	 */
	CSVDialect.prototype.setQuoteEscaper - function (quoteEscaper) {
		if (/^(double|dbl|quote|qt?|["'`])$/.test(quoteEscaper)) {
			this.__quoteEscaper_ = "quote";
			this.__quoteEscapeChar__ = this.__openQuote_ || (this.__openQuote_ = this.__closeQuote_ = /^["']$/.test(quoteEscaper) ? quoteEscaper : '"');
		} else if (/^(a(nti-?slash)?|\\)$/.test(quoteEscaper)) {
			this.__quoteEscaper_ = "antislash";
			this.__quoteEscapeChar__ = '\\';
		} else {
			throw new TypeError('Incorrect argument');
		}
		return this;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.getQuoteEscapeChar - function () {
		return this.__quoteEscapeChar__;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.setQuoteEscapeChar - function (quoteEscapeChar) {
		return this.setQuoteEscaper(quoteEscapeChar);
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.getDateTimeValueType = function () {
		return this.__dataTimeValueType_ || (this.__dataTimeValueType_ = 'base');
	};
	/**
	 * 
	 * @param {*} type 
	 * @returns 
	 */
	CSVDialect.prototype.setDateTimeValueType = function (type) {
		var _typ;
		if ((((typeof type === 'string')) || (type instanceof String))) {
			if ((DATA_STORE__DATE_SERIAL_TYPES.indexOf(_typ = type.toLowerCase()) >= 0)
				|| (_typ = SQLLITE__DATE_SERIAL_TYPES_MAP[_typ])) {
				this.__dataTimeValueType_ = _typ;
			} else if (DATA_STORE__DATE_SERIAL_TYPES.indexOf(this.__dataTimeValueType_) < 0) {
				this.__dataTimeValueType_ = 'timestamp';
			}
		} else {
			this.__dataTimeValueType_ = 'base';
		}
		return this;
	};
	/**
	 * Sets the stringifier to used when converting any value to string representation that corresponds to dialect options.
	 * @returns {CSVDialect}
	 */
	CSVDialect.prototype.setValueStringifier = function () {
		//The regular expression to match string representation of boolean, number, null and undefined values
		this.__primaryDataTypeStringValueAlwaysQuotesRegex__ = this.getPrimaryDataTypeStringValueAlwaysQuotesRegex();
		if (this.__quoteAllValues_) { //delimiters, quotes  and line breaks (multi line value) can be in values
			if (this.acceptMultiLineValues) {
				if (this.__escapeLineBreak_) {
					this.__toCSVString = this.__preventCSVInjection_ ? csvEscapeFormulaAndQuoteAllValuesStringValue : this.csvQuoteAllValuesStringValue; //
				} else {
					this.__toCSVString = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndSingleLineQuoteAllValuesString : this.csvSingleLineQuoteAllValuesStringValue; //
				}
			} else {
				this.__toCSVString = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndQuoteAllValuesNoLFStringValue : this.csvQuoteAllValuesNoLFStringValue; //
			}
		} else {
			if (this.acceptMultiLineValues) {
				if (this.__explicitQuotedColumns_ && this.__explicitQuotedColumns_.length) {
					this.__toCSVString = this.csvMultiLineExplicitQuotedStringValue; //
				} else if (this.__allowValueQuoting_) {
					this.__toCSVString = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndMultiLineAutoQuotedValueString : this.csvMultiLineAutoQuotedValueString; //
				} else { //no delimiter and no quotes  but can have line breaks (no multi line value) in values
					this.__toCSVString = this.__preventCSVInjection_ ? (this.__escapeLineBreak_ ? this.csvEscapeFormulaAndMultiEscapableLineStringValue : this.csvEscapeFormulaAndMultiLineStringValue) : 
						(this.__escapeLineBreak_ ? this.csvMultiEscapableLineStringValue : this.csvMultiLineStringValue);
				}
			} else if (this.__explicitQuotedColumns_ && this.__explicitQuotedColumns_.length) {
				this.__toCSVString = this.csvExplicitQuotedStringValue; //
			} else if (this.__allowValueQuoting_) {
				this.__toCSVString = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndAutoQuotedValueString : this.csvAutoQuotedValueString; //
			} else { //no delimiter and no quotes  and no line breaks (no multi line value) in values
				this.__toCSVString = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndStringValue : this.csvStringValue; //
			}
			if (this.__quoteAllStringValues_) {
				if (this.acceptMultiLineValues) {
					if (this.__escapeLineBreak_) {
						this.__stringCsvValue = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndQuoteAllValuesStringValue : this.csvQuoteAllValuesStringValue; //
					} else {
						this.__stringCsvValue = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndSingleLineQuoteAllValuesStringValue : this.csvSingleLineQuoteAllValuesStringValue; //
					}
				} else {
					this.__stringCsvValue = this.__preventCSVInjection_ ? this.csvEscapeFormulaAndQuoteAllValuesNoLFStringValue : this.csvQuoteAllValuesNoLFStringValue; //
				}
				if ((typeof this.__trueStringValue_ !== 'undefined') && this.__trueStringValue_) {
					if ((typeof this.__falseStringValue_ !== 'undefined') && this.__falseStringValue_) {
						this.convertBool = function(val) {
							return val === false ? this.__falseStringValue_ : val === true ? this.__trueStringValue_ : val === undefined ? this.__undefinedStringValue_ :  this.__nullStringValue_ != undefined ? this.__nullStringValue_ !== undefined : null;
						};
					} else {
						this.convertBool = function(val) {
							return val === false ? val : val === true ? this.__trueStringValue_ : val === undefined ? this.__undefinedStringValue_ :  this.__nullStringValue_ != undefined ? this.__nullStringValue_ !== undefined : null;
						};
					}
				} else if ((typeof falseStringValue !== 'undefined') && falseStringValue) {
					this.convertBool = function(val) {
						return val === false ? this.__falseStringValue_ : val === true ? val : val === undefined ? this.__undefinedStringValue_ : this.__nullStringValue_ != undefined ? this.__nullStringValue_ !== undefined : null;
					};
				}
			} else {
				if (this.__alwaysQuoteEmptyStringValue_
						|| ((this.__undefinedStringValue_ === '') && this.alwaysQuoteUndefinedStringValues)
						|| ((this.__nullStringValue_ === '') && this.alwaysQuoteNullStringValues)
				) {
					if (this.__primaryDataTypeStringValueAlwaysQuotesRegex__) {
						this.__stringCsvValue = function(str) {
							return str === '' || this.__primaryDataTypeStringValueAlwaysQuotesRegex__.test(str) ? 
								this.__openQuote_ + str + this.__closeQuote_ : this.__toCSVString(str);
						};
					} else {
						this.__stringCsvValue = function(str) {
							return str === '' ? this.__openQuote_ + this.__closeQuote_ : this.__toCSVString(str);
						};
					}
				} else if (this.__primaryDataTypeStringValueAlwaysQuotesRegex__) {
					this.__stringCsvValue = function(str) {
						return this.__toCSVString(this.__primaryDataTypeStringValueAlwaysQuotesRegex__.test(str) ? 
							this.__openQuote_ + this.__closeQuote_ : str);
					};
				} else {
					this.__stringCsvValue = this.__toCSVString;
				}
			}
		}
		//
		this.___escapedQuoteRegexp__ = new RegExp((this.__quoteEscapeChar_||(this.__quoteEscapeChar_ = this.__openQuote_)) + this.__openQuote_, 'g');
		//
		this.___escapedLineBreakRegexp__ = new RegExp((this.__lineBreakEscapeChar_
														||(this.__quoteEscapeChar_||(this.__quoteEscapeChar_ = this.__openQuote_)))
														+ (this.__lineBreak_ ? this.__lineBreak_ === '\n' ? '\\n' : this.__lineBreak_ === '\r\n' ? '\\r\\n': '\\r' : '\\n'), 'g');
		

		if (this.__preventCSVInjectionEscaper_ == undefined) { //if this.__preventCSVInjectionEscaper_ undefined or null
			this.__preventCSVInjectionEscaper_ = "'"
		}

		if (this.__preventCSVInjection_ == undefined) { //if this.__preventCSVInjectionEscaper_ undefined or null
			this.__preventCSVInjection_ = false;
		}
		return this;
	}
	/**
	 * 
	 * @param {*} delim 
	 * @returns 
	 */
	CSVDialect.prototype.setDelim = function (delim) {
		if (!CSV_ACCEPTED_DELIMS_RE.test(delim)) {
			throw new Error('Incorrect delimiter: ' + delim)
		}
		this.__delim_ = delim;
		this.setAutoEnclosedRegexp();
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.getDelim = function () {
		if (!this.__delim_ || !CSV_ACCEPTED_DELIMS_RE.test(this.__delim_)) {
			this.__delim_ = ',';
			this.setAutoEnclosedRegexp();
		}
		return this.__delim_;
	};

	CSVDialect.prototype.setDelimiter = CSVDialect.prototype.setDelim;

	CSVDialect.prototype.getDelimiter = CSVDialect.prototype.getDelim;

	CSVDialect.prototype.setSeparator = CSVDialect.prototype.setDelim;

	CSVDialect.prototype.getSeparator = CSVDialect.prototype.getDelim;

	function _getWordPattern(str, caseless) {
		if (!str)
			return '';
		var i = 0, n = str.length;
		var ch, lower, upper, pattern;
		if (!caseless) {
			return regexEscape(str);
		}
		pattern = '';
		for (; i < n; i++) {
			ch = str[i];
			upper = ch.toUpperCase();
			lower = ch.toLowerCase();
			pattern += lower;
			if (upper != lower) {
				pattern += upper;
			}
		}
		return regexEscape(pattern);
	}

	CSVDialect.getWordRegexPattern = _getWordPattern;
	/**
	 * Returns the regular expression to match string representation of boolean, number, null and undefined values.
	 * @returns {RegExp}
	 */
	CSVDialect.prototype.getPrimaryDataTypeStringValueAlwaysQuotesRegex = function() {
		if (this.__quoteAllValues_ || this.__quoteAllStringValues_)
			return null;
		var re = [];
		if (this.alwaysQuoteNumberStringValues) {
			re.push('\\d+(?:\\.\\d+)?');
		}
		if (this.alwaysQuoteBooleanStringValues) {
			x = _getWordPattern(this.__trueStringValue_, this.booleanCaselessStringValues);
			if (x)
				re.push(regexEscape(x));
			x = _getWordPattern(this.__falseStringValue_, this.booleanCaselessStringValues);
			if (x)
				re.push(regexEscape(x));
		}
		if (this.__undefinedStringValue_ && this.alwaysQuoteUndefinedStringValues) {
			x = _getWordPattern(this.__undefinedStringValue_, this.undefinedCaselessStringValues);
			if (x)
				re.push(regexEscape(x));
			if (this.__nullStringValue_ && this.alwaysQuoteNullStringValues
					&& (this.__nullStringValue_ != this.__undefinedStringValue_)) {
				x = _getWordPattern(this.__nullStringValue_, this.nullCaselessStringValues);
				if (x)
					re.push(x);
			}
		} else if (this.__nullStringValue_ && this.alwaysQuoteNullStringValues) {
			x = _getWordPattern(this.__nullStringValue_, this.nullCaselessStringValues);
			if (x)
				re.push(x);
		}
	
		return re.length ? new RegExp("^(?:" + re.join("|") + ")$") : null;		
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.setAutoEnclosedRegexp = function () {
		this.__enclosableRe__ = new RegExp(this.__openQuote_ + '|(\\n|\\r\\n?)|' + regexEscape(this.__delim_));
		this.__singleLineValueEnclosableRe__ = new RegExp(this.__openQuote_ + '|' + regexEscape(this.__delim_));
		this.__autoEnclosedRegex__ = new RegExp("(\\n|\\r\\n?)|("+ (this.__openQuote_ || (this.__openQuote_ = '"')) + ')', "g");
		this.__autoEnclosedSingleLineValueRegex__ = new RegExp("(\\n|\\r\\n?)|("
			+ (this.__openQuote_ || (this.__openQuote_ = '"')) + ')', "g");

		this.__autoEnclosedMultiLineValuesRegex__ = new RegExp("(\\n|\\r\\n?)|("
			+ (this.__openQuote_ || (this.__openQuote_ = '"')) + ')', "g");

		this.__autoEnclosedNoMultiLineValuesRegex__ = new RegExp(
			(this.__openQuote_ || (this.__openQuote_ = '"')), "g");

		this.__delimRegexp__ = new RegExp(regexEscape(this.__delim_), "g");
		this.__quoteRegexp__ = new RegExp(regexEscape(this.__openQuote_), "g");
		return this;
	};
	/**
	 * 
	 * @returns {Array} 
	 */
	CSVDialect.prototype.getExplicitQuotedColumns = function () {
		return this.__explicitQuotedColumns_;
	};

	/**
	 * 
	 * @param {Array|string} quotedColumns 
	 * @returns {CSVDialect} 
	 */
	CSVDialect.prototype.setExplicitQuotedColumns = function (quotedColumns) {
		if (arguments.length === 0) {
			throw new TypeError('Argument expected');
		}
		if (Array.isArray(quotedColumns)) {
			this.__explicitQuotedColumns_ = quotedColumns;
		} else if ((typeof quotedColumns === 'string') || (quotedColumns instanceof String)) {
			this.__explicitQuotedColumns_ = quotedColumns.trim().split(/\s*\|\s*/);
		} else if (!quotedColumns) {
			this.__explicitQuotedColumns_ = [];
		} else {
			throw new TypeError('Incorrect arguments');
		}
		return this;
	};
	/**
	 * 
	 * @param {*} alwaysQuote 
	 * @returns 
	 */
	CSVDialect.prototype.setQuoteAllValues = function(alwaysQuote) {
		this.__quoteAllValues_ = arguments.length ? toBool(alwaysQuote) : true;
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.isQuoteAllValues = function() {
		return this.__quoteAllValues_;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.getQuoteAllValues = CSVDialect.prototype.isQuoteAllValues;

	CSVDialect.prototype.getAlwaysQuote = CSVDialect.prototype.isQuoteAllValues;

	CSVDialect.prototype.isAlwaysQuote = CSVDialect.prototype.isQuoteAllValues;

	CSVDialect.prototype.setAlwaysQuote = CSVDialect.prototype.setQuoteAllValues;

	/**
	 * 
	 * @param {*} alwaysQuote 
	 * @returns 
	 */
	CSVDialect.prototype.setQuoteAllStringValues = function(alwaysQuote) {
		this.__quoteAllStringValues_ = arguments.length ? toBool(alwaysQuote) : true;
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.isQuoteAllStringValues = function() {
		return this.__quoteAllStringValues_;
	};
	/**
	 * 
	 */
	CSVDialect.prototype.getQuoteAllStringValues = CSVDialect.prototype.isQuoteAllStringValues;

	CSVDialect.prototype.getAlwaysQuoteString = CSVDialect.prototype.isQuoteAllStringValues;

	CSVDialect.prototype.isAlwaysQuoteString = CSVDialect.prototype.isQuoteAllStringValues;

	CSVDialect.prototype.setAlwaysQuoteString = CSVDialect.prototype.setQuoteAllStringValues;
	/**
	 * 
	 * @param {*} alwaysQuote 
	 * @returns 
	 */
	CSVDialect.prototype.setWithBOM = function(alwaysQuote) {
		this.__withBOM_ = arguments.length ? toBool(alwaysQuote) : true;
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.isWithBOM = function() {
		return !!this.__withBOM_;
	};

	CSVDialect.prototype.getWithBOM = function() {
		return this.__withBOM_;
	};
	/**
	 * 
	 * @param {*} str 
	 * @returns 
	 */
	CSVDialect.prototype.stringValue = function (str) {
		return str;
	};
	/**
	 * 
	 * @param {*} date 
	 * @returns 
	 */
	CSVDialect.prototype.dateValue = function (date) {
		return date;
	};
	/**
	 * 
	 * @param {*} dateTime 
	 * @returns 
	 */
	CSVDialect.prototype.dateTimeValue = function (dateTime) {
		return dateTime;
	};
	/**
	 * 
	 * @param {*} time 
	 * @returns 
	 */
	CSVDialect.prototype.timeValue = function (time) {
		return time;
	};
	/**
	 * 
	 * @param {*} time 
	 * @returns 
	 */
	CSVDialect.prototype.formatDate = function (time) {
		//TODO
		return toISO8601DateString(time, this.__displayISOTimezone_);
	};
	/**
	 * 
	 * @param {*} time 
	 * @returns 
	 */
	CSVDialect.prototype.formatDateTime = function (time) {
		//TODO
		return toISO8601DateTimeString(time, this.__displayISOTimezone_);
	};
	/**
	 * 
	 * @param {*} time 
	 * @returns 
	 */
	CSVDialect.prototype.formatTime = function (time) {
		//TODO
		return toISO8601TimeString(time, this.__displayISOTimezone_);
	};
	/**
	 * 
	 * @param {*} minYear 
	 * @param {*} maxYear 
	 * @returns 
	 */
	CSVDialect.prototype.randomDate = function (minYear, maxYear) {
		var year = randomYear(minYear, maxYear);
		var month = randomMonth();
		return this.convertDate(new Date(
			year,
			month - 1,
			randomDayOfMonth(year, month),
			0,
			0,
			0,
			0
		), 'date');
	};
	/**
	 * 
	 * @param {*} type 
	 * @param {Date} [date] 
	 * @returns 
	 */
	CSVDialect.prototype.randomTime = function (type, date) {
		if (!date) {
			date = new Date(timeBaseDate);
		}
		return this.convertDate(setTypedTime(date, type), 'time');
	};
	/**
	 * 
	 * @param {integer} minYear 
	 * @param {integer} maxYear 
	 * @param {*} type 
	 * @returns 
	 */
	CSVDialect.prototype.randomDateTime = function (minYear, maxYear, type) {
		return this.convertDate(setTypedTime(this.randomDate(minYear, maxYear), type), 'datetime');
	};

	setTypedTime = function (date, type) {
		switch (type || 'hms') {
			case 'hms':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(0);
				return date;
			case 'hm':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(0);
				date.setMilliseconds(0);
				return date;
			case 'h':
				date.setHours(randomHour());
				date.setMinutes(0);
				date.setSeconds(0);
				date.setMilliseconds(0);
				return date;
			case 'full':
			case 'all':
				date.setHours(randomHour());
				date.setMinutes(randomMinute());
				date.setSeconds(randomSecond());
				date.setMilliseconds(randomMillisecond());
				return date;
			default:
				throw new Error('Incorrect date time format type: ' + type);
		}
	};
	/**
	 * 
	 * @param {*} column 
	 * @returns 
	 */
	CSVDialect.prototype.valueOfEmptyQuotedString = function(column) {
		var typ = column.dataType;
		if (typ && isStringDataType(typ.toLowerCase()))
			return '';
		return null;
	};
	/**
	 * 
	 * @param {*} column 
	 * @returns 
	 */
	CSVDialect.prototype.valueOfEmptyString = function(column) {
		var typ = column.dataType;
		if (typ &&  isStringDataType(typ.toLowerCase()))
			return '';
		return null;
	}
	/**
	 * 
	 * @param {*} qt 
	 * @returns 
	 */
	CSVDialect.prototype.getQuote = function (qt) {
		return this.__openQuote_ || (this.__openQuote_ = this.__closeQuote_ = '"')
	};
	/**
	 * 
	 * @param {*} qt 
	 * @returns 
	 */
	CSVDialect.prototype.setQuote = function (qt) {
		if ((this.___allowOnlyDoubleQuoteEnclosing__ && qt !== '"') || (!CSV_ACCEPTED_QUOTES_RE.test(qt))) {
			throw new TypeError('Unaccepted enclosing value: ' + qt);
		}
		this.__openQuote_ = this.__closeQuote_ = qt;
		return this;
	};

	CSVDialect.prototype.getOpenQuote = CSVDialect.prototype.getQuote;

	CSVDialect.prototype.getCloseQuote = CSVDialect.prototype.setQuote;

	CSVDialect.prototype.setOpenQuote = CSVDialect.prototype.setQuote;

	CSVDialect.prototype.setCloseQuote = CSVDialect.prototype.setQuote;

	CSVDialect.prototype.getEncloser = CSVDialect.prototype.getQuote;

	CSVDialect.prototype.setEncloser = CSVDialect.prototype.setQuote;
	/**
	 * 
	 * @returns {boolean}
	 */
	CSVDialect.prototype.isAllowValueQuoting = function () {
		return this.__allowValueQuoting_;
	};
	/**
	 * 
	 * @alias CSVDialect.prototype.isAllowValueQuoting 
	 * @returns {boolean}
	 */
	CSVDialect.prototype.getAllowValueQuoting = CSVDialect.prototype.isAllowValueQuoting;
	/**
	 * 
	 * @param {*} allowValueQuoting 
	 * @returns {SereniX.data.CSVDialect} 
	 */
	CSVDialect.prototype.setAllowValueQuoting = function (allowValueQuoting) {
		this.__allowValueQuoting_ = arguments.length ? toBool(allowValueQuoting) : true;
		return this;
	};

	CSVDialect.prototype.isAcceptUnicode = function () {
		return this.__acceptUnicode_;
	};

	CSVDialect.prototype.getAcceptUnicode = CSVDialect.prototype.isAcceptUnicode;

	CSVDialect.prototype.isSupportUnicode = CSVDialect.prototype.isAcceptUnicode;

	CSVDialect.prototype.getSupportUnicode = CSVDialect.prototype.isAcceptUnicode;

	CSVDialect.prototype.setAcceptUnicode = function (allow) {
		this.__acceptUnicode_ = arguments.length ? toBool(allow) : true;
		return this;
	};

	CSVDialect.prototype.setSupportUnicode = CSVDialect.prototype.setAcceptUnicode;

	CSVDialect.prototype.isAllowQuoteAllValues = function () {
		return this.__acceptUnicode_;
	};

	CSVDialect.prototype.getAllowQuoteAllValues = CSVDialect.prototype.isAllowQuoteAllValues;

	CSVDialect.prototype.setAcceptUnicode = function (allow) {
		this.__allowQuoteAllValues_ = arguments.length ? toBool(allow) : true;
		return this;
	};

	CSVDialect.prototype.isAcceptMultiLineValues = function () {
		return this.__acceptMultiLineValues_;
	};

	CSVDialect.prototype.getAcceptMultiLineValues = CSVDialect.prototype.isAcceptMultiLineValues;

	CSVDialect.prototype.setAcceptMultiLineValues = function (accept) {
		this.__acceptMultiLineValues_ = arguments.length ? toBool(accept) : true;
		return this;
	};



	CSVDialect.prototype.isAllowMultiLineValues = CSVDialect.prototype.isAcceptMultiLineValues;

	CSVDialect.prototype.getAllowMultiLineValues = CSVDialect.prototype.isAcceptMultiLineValues;

	CSVDialect.prototype.setAllowMultiLineValues = CSVDialect.prototype.setAcceptMultiLineValues;


	CSVDialect.prototype.isSupportMultiLineValues = CSVDialect.prototype.isAcceptMultiLineValues;

	CSVDialect.prototype.getSupportMultiLineValues = CSVDialect.prototype.isAcceptMultiLineValues;

	CSVDialect.prototype.setSupportMultiLineValues = CSVDialect.prototype.setAcceptMultiLineValues;








	CSVDialect.prototype.convertBool = function (val) {
		return val == undefined ? val : '' + val;
	};

	CSVDialect.prototype.csvMultiLineExplicitQuotedStringValue = function (str, column) { // no multi lines
		var quoteEscapeChar;
		if ((this.__explicitQuotedColumns_.indexOf(column) >= 0) || (this.__enclosableRe__.test(str))) {
			quoteEscapeChar = this.__quoteEscapeChar_;
			return this.__openQuote_ + str.replace(this.__autoEnclosedMultiLineValuesRegex__, function ($0, $1, $2) {
				return $1 ? '\\n' : quoteEscapeChar + $2;
			}) + this.__closeQuote_;
		}
		return str;
	};

	CSVDialect.prototype.csvExplicitQuotedStringValue = function (str, column) { // no multi lines
		var quoteEscapeChar;
		if ((this.__explicitQuotedColumns_.indexOf(column) >= 0) || (this.__enclosableRe__.test(str))) {
			quoteEscapeChar = this.__quoteEscapeChar_;
			return this.__openQuote_ + str.replace(this.__autoEnclosedNoMultiLineValuesRegex__, function ($0, $1) {
				return quoteEscapeChar + $0;
			}) + this.__closeQuote_;
		}
		return str;
	};

	CSVDialect.prototype.csvMultiLineAutoQuotedValueString = function (str, column) {
		if (this.__enclosableRe__.test(str)) {
			quoteEscapeChar = this.__quoteEscapeChar_;
			return this.__openQuote_ + str.replace(this.__autoEnclosedNoMultiLineValuesRegex__, function ($0, $1) {
				return quoteEscapeChar + $0;
			}) + this.__closeQuote_;
		}
		return str;
	};

	CSVDialect.prototype.csvEscapeFormulaAndMultiLineAutoQuotedValueString = function (str, column) {
		return this.csvMultiLineAutoQuotedValueString(_escapeFormula(str, this.__preventCSVInjectionEscaper_));
	};

	CSVDialect.prototype.csvAutoQuotedValueString = function (str) {
		if (this.__enclosableRe__.test(str)) {
			quoteEscapeChar = this.__quoteEscapeChar_;
			return this.__openQuote_ + str.replace(this.__autoEnclosedNoMultiLineValuesRegex__, function ($0, $1) {
				return quoteEscapeChar + $0;
			}) + this.__closeQuote_;
		}
		return str;
	};

	CSVDialect.prototype.csvEscapeFormulaAndAutoQuotedValueString = function (str) {
		return this.csvAutoQuotedValueString(_escapeFormula(str, this.__preventCSVInjectionEscaper_));
	};

	CSVDialect.prototype.csvQuoteAllValuesNoLFStringValue = function (str) {
		var quoteEscapeChar = this.__quoteEscapeChar_;
		return this.__openQuote_ + str.replace(this.__autoEnclosedNoMultiLineValuesRegex__, function ($0, $1) {
			return quoteEscapeChar + $0;
		}) + this.__closeQuote_;
	};

	CSVDialect.prototype.csvEscapeFormulaAndQuoteAllValuesNoLFStringValue = function (str) {
		return this.csvQuoteAllValuesNoLFStringValue(_escapeFormula(str, this.__preventCSVInjectionEscaper_));
	};

	CSVDialect.prototype.csvSingleLineQuoteAllValuesStringValue = function (str) {
		var quoteEscapeChar = this.__quoteEscapeChar_;
		return this.__openQuote_ + str.replace(this.__autoEnclosedSingleLineValueRegex__, function ($0) {
			return quoteEscapeChar + $0;
		}) + this.__closeQuote_;
	};

	CSVDialect.prototype.csvEscapeFormulaAndSingleLineQuoteAllValuesString = function (str) {
		var quoteEscapeChar = this.__quoteEscapeChar_;
		return this.__openQuote_ + _escapeFormula(str, this.__preventCSVInjectionEscaper_).replace(this.__autoEnclosedSingleLineValueRegex__, function ($0) {
			return quoteEscapeChar + $0;
		}) + this.__closeQuote_;
	};

	CSVDialect.prototype.csvQuoteAllValuesStringValue = function (str) {
		var quoteEscapeChar = this.__quoteEscapeChar_;
		return this.__openQuote_ + str.replace(this.__autoEnclosedRegex__, function ($0, $1, $2) {
			return $1 ? '\\n' : quoteEscapeChar + $2;
		}) + this.__closeQuote_;
	};
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

	CSVDialect.prototype.csvEscapeFormulaAndQuoteAllValuesStringValue = function (str) {
		var quoteEscapeChar = this.__quoteEscapeChar_;
		return this.__openQuote_
			+ _escapeFormula(str, this.__preventCSVInjectionEscaper_)
				.replace(this.__autoEnclosedRegex__, function ($0, $1, $2) {
					return $1 ? '\\n' : quoteEscapeChar + $2;
				})
			+ this.__closeQuote_;
	};
	/**
	 * Use when data can only have delimiters in value but no quote
	 * @param {*} str 
	 * @returns 
	 */
	CSVDialect.prototype.csvStringValue = function (str) {
		return str.replace(this.__delimRegexp__, function (match) { return '\\' + match; });
	};

	/**
	 * Use when data can only have delimiters in value but no quote
	 * @param {*} str 
	 * @returns 
	 */
	CSVDialect.prototype.csvEscapeFormulaAndStringValue = function (str) {
		return  _escapeFormula(str, this.__preventCSVInjectionEscaper_)
			.replace(this.__delimRegexp__, function (match) { return '\\' + match; });
	};


	//no delimiter and no quotes  but can have line breaks (no multi line value) in values
	//line break characters are not escapable
	CSVDialect.prototype.csvMultiLineStringValue = function (str) { //
		return /\n|\r\n?/.test(str) ? this.__openQuote_ + str + this.__closeQuote_ : str;
	};

	//no delimiter and no quotes  but can have line breaks (no multi line value) in values
	//line break characters are not escapable
	CSVDialect.prototype.csvEscapeFormulaAndMultiLineStringValue = function (str) { //
		return /\n|\r\n?/.test(str = _escapeFormula(str, this.__preventCSVInjectionEscaper_)) ? this.__openQuote_ + str + this.__closeQuote_ : str;
	};


	CSVDialect.prototype.csvMultiEscapableLineStringValue = function (str) { //
		var escaped = str.replace(/\n|\r\n?/g, function (match) { return '\\' + match; });
		return escaped.length !== str.length ? this.__openQuote_ + escaped + this.__closeQuote_ : str;
	};


	CSVDialect.prototype.csvEscapeFormulaAndMultiEscapableLineStringValue = function (str) { //
		var escaped = (str = _escapeFormula(str, this.__preventCSVInjectionEscaper_))
				.replace(/\n|\r\n?/g, function (match) { return '\\' + match; });
		return escaped.length !== str.length ? this.__openQuote_ + escaped + this.__closeQuote_ : str;
	};
	/**
	 * Use when data has no quote and not delimiters in value
	 * @param {*} str 
	 * @returns 
	 */
	CSVDialect.prototype.csvSameStringValue = function (str) {
		return str;
	};

	/**
	 * Use when data has no quote and not delimiters in value
	 * @param {String} str 
	 * @returns {string}
	 */
	CSVDialect.prototype.csvEscapeFormulaAndSameStringValue = function (str) {
		return _escapeFormula(str, this.__preventCSVInjectionEscaper_);
	};
	// See https://github.com/adaltas/node-csv/pull/387
	// More about CSV injection or formula injection, when websites embed
	// untrusted input inside CSV files:
	// https://owasp.org/www-community/attacks/CSV_Injection
	// http://georgemauer.net/2017/10/07/csv-injection.html
	// Apple Numbers unicode normalization is empirical from testing
	function _escapeFormula(str, escaper) {
		if (!(new RegExp('^' + escaper + regexEscape(CSV_INJECTION_CHARS_STRING))).test(str) || CSV_INJECTION_CHARS_REGEXP.test(str)) {
			return escaper + str;
		}
		return str;
	};

	CSVDialect.escapeFormula = _escapeFormula;

	function _unescapeFormula(str, escaper) {
		if ((new RegExp('^' + escaper + regexEscape(CSV_INJECTION_CHARS_STRING))).test(str)) {
			return str.substring(escaper.length);
		}
		if ((new RegExp('^' + escaper + escaper + regexEscape(CSV_INJECTION_CHARS_STRING))).test(str)) {
			return str.substring(escaper.length * 2);
		}
		return str;
	};

	CSVDialect.unescapeFormula = _unescapeFormula;

	CSVDialect.prototype.convertDate = function (val, dataType) {
		if ((cvt = sqlLiteDateTimeConverters[this.__dataTimeValueType_])) {
			return this.__toCSVString('' + cvt[dataType](val));
		}
		return this.__toCSVString(dataType === 'date' ? this.formatDate(val) : dataType === 'datetime' ? this.formatDateTime(val) : this.formatTime(val));
	};

	CSVDialect.prototype.convert = function (val, column) {
		var sval;
		var cvt;
		var dataType = (column.dataType || '').toLowerCase();
		if (val === undefined) {
			return this.__undefinedStringValue_;
		}
		if (val === null) {
			return this.__nullStringValue_;
		}
		if (val instanceof Date) {
			return this.convertDate(val, dataType);
		} else if (/^bool(ean)?$/.test(dataType || '')) {
			if ((val instanceof Boolean) || (val instanceof Number) || (val instanceof String)) {
				val = val.valueOf();
			}
			if (/^(boolean|number)$/.test(typeof val)) {
				return this.__toCSVString(val ? this.__trueStringValue_ : this.__falseStringValue_);
			}
			if (typeof val === 'string') {
				if (/true|on|y(es)?|oui|1/.test(v = val.toLowerCase()))
					return this.__toCSVString(this.__trueStringValue_);
				if (/false|off|n(on?)?|0/.test(v))
					return this.__toCSVString(his.__falseStringValue_);
			}
			throw new TypeError('Incorrect boolean value: ' + val);
		}
		

		if (isStringDataType(dataType, val) || !dataType) {
			try {
			return this.__stringCsvValue(val);
			} catch (err) {
				console.log(err);
				throw err;
			}
		}
		if ((sval = checkNumberDataType(dataType, val)) !== false) {
			sval = '' + sval;
		} else if (/^bool(ean)?$/.test(dataType)) {
			sval = this.convertBool(val);
		} else if (/^(?:object|array)$/.test(toType(val))) {
			sval = JSON.stringify(val);
		} else {
			switch (getDataTypeAffinity(column.dataType)) {
				case 'TEXT':
					this.__toCSVString(val);
				case 'BLOB':
					return this.__toCSVString(val);
			}
		}
		return this.__toCSVString(sval);
	};

	CSVDialect.prototype.toDate = function(strDate) {
		if (this.dateFormat === 'iso8601') {
			 
		} else {
			return stringToDateTimeConverters[this.__dataTimeValueType_].date(strDate);
		}
	}

	CSVDialect.prototype.toDateTime = function(strDate) {
		if (this.dateFormat === 'iso8601') {
			 return new Date(strDate);
		} else {
			return stringToDateTimeConverters[this.__dataTimeValueType_].datetime(strDate);
		}
	};

	CSVDialect.prototype.toTime = function(strDate) {
		if (this.dateFormat === 'iso8601-time') {
			return new Date("1970-01-01T" + strDate);
		} else if (this.dateFormat === 'iso8601') {
			return new Date(strDate);
		} else {
			return stringToDateTimeConverters[this.__dataTimeValueType_].time(strDate);
	   	}
	}

	CSVDialect.prototype.stringValue = function(str) {
		if (this.__quoteAllValues_ || this.__allowValueQuoting_) {
			if (this.__acceptMultiLineValues_) {
				if ((str[0] === this.__openQuote_) && (str[0] === this.__closeQuote_)) {
					str = str.substring(1, str.length - 1)
						.replace(this.___escapedQuoteRegexp__, this.__openQuote_);	
					if (this.__escapeLineBreak_) {
						str = str.replace(this.___escapedLineBreakRegexp__, this.__openQuote_)
					}				
				}
			} else {
				if ((str[0] === this.__openQuote_) && (str[0] === this.__closeQuote_)) {
					str = str.substring(1, str.length - 1).replace(this.___escapedQuoteRegexp__, this.__openQuote_);					
				}
			}
		}
		return str;
	};

	CSVDialect.prototype.toValue = function(strVal, field) {
		var sval;
		var dataType = (field.dataType||'any').toLowerCase();
		if (this.__quoteAllValues_ || this.__allowValueQuoting_) {
			if (this.__acceptMultiLineValues_) {
				if ((strVal[0] === this.__openQuote_) && (strVal[0] === this.__closeQuote_)) {
					sval = strVal;
					strVal = strVal.substring(1, strVal.length - 1)
						.replace(this.___escapedQuoteRegexp__, this.__openQuote_);	
					if (this.__escapeLineBreak_) {
						strVal = strVal.replace(this.___escapedLineBreakRegexp__, this.__openQuote_)
					}				
				}
			} else {
				if ((strVal[0] === this.__openQuote_) && (strVal[0] === this.__closeQuote_)) {
					sval = strVal;
					strVal = strVal.substring(1, strVal.length - 1).replace(this.___escapedQuoteRegexp__, this.__openQuote_);					
				}
			}
		} else if (this.explicitQuotedColumns && this.explicitQuotedColumns.length) {
			//TODO
			throw new Error('Not yet supported');
		}
		if (isIntegerDataType(dataType)) {
			return strVal ? parseInt(strVal, 10) : null;
		}
		if (isFloatingPointDataType(dataType)) {
			return strVal ? parseFloat(strVal, 10) : null;
		}
		if (isStringDataType(dataType, strVal) || dataType === 'any') {
			return strVal;
		}
		switch(dataType) {
			case 'date':
				return this.toDate(strVal);
			case 'datetime':
				return this.toDateTime(strVal);
			case 'time':
				return this.toTime(strVal);
		}
		return /^bool(ean)?$/.test(dataType) ? toBool(strVal) : strVal;
	};

	CSVDialect.prototype.setShouldLastRecordHasLineBreak = function(should) {
		this.__shouldLastRecordHasLineBreak_ = arguments.length ? toBool(should) : true;
		return this;
	}

	CSVDialect.prototype.isShouldLastRecordHasLineBreak = function() {
		return this.__shouldLastRecordHasLineBreak_;
	};

	CSVDialect.prototype.getShouldLastRecordHasLineBreak = CSVDialect.prototype.isShouldLastRecordHasLineBreak;

	CSVDialect.prototype.isShouldWriteHeaders = function() {
		return this.__shouldWriteHeaders_;
	};
	CSVDialect.prototype.getShouldWriteHeaders = CSVDialect.prototype.isShouldWriteHeaders;

	CSVDialect.prototype.setShouldWriteHeaders = function(should) {
		this.__shouldWriteHeaders_ = arguments.length ? toBool(should) : true;
		return this;
	}; 

	CSVDialect.prototype.isNoValueWithQuoteChar = function() {
		return this.__noValueWithQuoteChar_;
	};
	CSVDialect.prototype.getNoValueWithQuoteChar = CSVDialect.prototype.isNoValueWithQuoteChar;

	CSVDialect.prototype.setNoValueWithQuoteChar = function(noValueWithQuoteChar) {
		this.__noValueWithQuoteChar_ = arguments.length ? toBool(noValueWithQuoteChar) : true;
		return this;
	};

	CSVDialect.prototype.isNoNestedQuotes = CSVDialect.prototype.isNoValueWithQuoteChar;

	CSVDialect.prototype.setNoNestedQuotes = CSVDialect.prototype.setNoValueWithQuoteChar;

	CSVDialect.prototype.getNoNestedQuotes = CSVDialect.prototype.getNoValueWithQuoteChar;

	CSVDialect.prototype.isNestedQuotes = function() {
		return !this.isNoValueWithQuoteChar();
	};
	CSVDialect.prototype.getNestedQuotes = CSVDialect.prototype.isNestedQuotes;

	CSVDialect.prototype.setNestedQuotes = function(nestedQuotes) {
		this.setNoNestedQuotes(arguments.length ? !toBool(nestedQuotes) : false);
	};
	CSVDialect.prototype.getLineBreak = function() {
		return this.__lineBreak_;
	}

	CSVDialect.prototype.setLineBreak = function(lineBreak) {
		var eol = lineBreak;
		if (eol instanceof String) {
			eol = eol.valueOf();
		}
		if ((typeof eol !== 'string') || !eol) {
			throw new TypeError('Incorrect line break character: ' + eol);
		}
		if (/^(line-?feed|lf|line-?break)$/.test(eol = eol.toLowerCase())) {
			eol = '\n';
		} else if (/^(carr?iage-?return|cr)$/.test(eol)) {
			eol = '\r';
		} else if (/^(cr-?lf|carr?iage-?return[+-]?line-?feed)$/.test(eol)) {
			eol = '\r\n';
		} else {
			switch(eol){
				case 'unix':
				  	eol = "\n";
				  	break;
				case 'mac':
				  	eol = "\r";
				  	break;
				case 'windows':
				  	eol = "\r\n";
				  	break;
				case 'ascii':
				  	eol = "\u001e";
				  	break;
				case 'unicode':
				  	eol = "\u2028";
				  	break;
				default:
					if (!/^(\n|\r\n?)$/.test(eol)) {
						throw new TypeError('Incorrect record delimiter (line break) character: ' + lineBreak);
					}
			}
			
		}
		this.__lineBreak_ = eol;
		return this;
	};

	CSVDialect.prototype.getEol = CSVDialect.prototype.getLineBreak;

	CSVDialect.prototype.setEol = CSVDialect.prototype.setLineBreak;

	CSVDialect.prototype.getEndOfLine = CSVDialect.prototype.getLineBreak;

	CSVDialect.prototype.setEndOfLine = CSVDialect.prototype.setLineBreak;

	CSVDialect.prototype.isExpandNestedObjects = function() {
		return this.__expandNestedObjects_;
	};

	CSVDialect.prototype.getExpandNestedObjects = CSVDialect.prototype.isExpandNestedObjects;

	CSVDialect.prototype.setExpandNestedObjects = function(expand) {
		this.__expandNestedObjects_ = arguments.length === 0 ? true : toBool(expand);
		return this;
	};

	CSVDialect.prototype.isExpandArrayObjects = function() {
		return this.__expandArrayObjects_;
	};

	CSVDialect.prototype.getExpandArrayObjects = CSVDialect.prototype.isExpandArrayObjects;

	CSVDialect.prototype.setExpandArrayObjects = function(expand) {
		this.__expandArrayObjects_ = arguments.length === 0 ? true : toBool(expand);
		return this;
	};
	/**
	 * 
	 * @returns 
	 */
	CSVDialect.prototype.getPreventCSVInjectionEscaper = function() {
		return this.__preventCSVInjectionEscaper_;
	};
	/**
	 * 
	 * @param {string} ch 
	 * @returns 
	 */
	CSVDialect.prototype.setPreventCSVInjectionEscaper = function(ch) {
		this.__preventCSVInjectionEscaper_ = ch;
		return this;
	};
	/**
	 * 
	 * @name CSVDialect.prototype.isPreventCSVInjection
	 * @method
	 * @returns {boolean}
	 */
	CSVDialect.prototype.isPreventCSVInjection = function() {
		return this.__preventCSVInjection_;
	};
	/**
	 * 
	 * @name CSVDialect.prototype.isPreventCSVInjection
	 * @method
	 * @returns {boolean}
	 */
	CSVDialect.prototype.getPreventCSVInjection = CSVDialect.prototype.isPreventCSVInjection;
	/**
	 * 
	 * @param {*} prevent 
	 * @returns 
	 */
	CSVDialect.prototype.setPreventCSVInjectionEscaper = function(prevent) {
		this.__preventCSVInjection_ = arguments.length ? !!prevent : true;
		return this;
	};
	/**
	 * When the returns value is true, it means that the stringify value of empty string is '""' (because the quote char is the double quote). Otherwise, the stringify value is the empty ''
	 * @name CSVDialect.prototype.isQuoteEmptyStringValue
	 * @method
	 * @returns {boolean}
	 */
	CSVDialect.prototype.isQuoteEmptyStringValue = function() {
		return this.__quoteEmptyStringValue_;
	};
	/**
	 * When the returns value is true, it means that the stringify value of empty string is '""' (because the quote char is the double quote). Otherwise, the stringify value is the empty ''
	 * <p>CSVDialect.prototype.getQuoteEmptyStringValue is an alias of CSVDialect.prototype.isQuoteEmptyStringValue.</p>
	 * @name CSVDialect.prototype.getQuoteEmptyStringValue
	 * @method
	 * @returns {boolean}
	 */
	CSVDialect.prototype.getQuoteEmptyStringValue = CSVDialect.prototype.isQuoteEmptyStringValue;
	/**
	 * 
	 * @param {boolean} [quote=true] 
	 * @returns 
	 */
	CSVDialect.prototype.setQuoteEmptyStringValue = function(quote) {
		this.__quoteEmptyStringValue_ = arguments.length ? toBool(quote) : true;
		return this;
	};

	var preventCSVInjectionSynonyms = ['preventCSVInjection', 'preventCsvInjection', 'preventFormulaInjection', 'escapeFormulas', 'escape_formulas', 'escapedFormulas', 'escaped_formulas'];

	var preventCSVInjectionEscaperSynonyms = [
		'preventCSVInjectionEscaper', 'preventCSVInjectionEscapeChar',
		'preventCsvInjectionEscaper', 'preventCsvInjectionEscapeChar',
		'escapeFormulasChar', 'escape_formulas_char', 'escapedFormulasChar', 'escaped_formulas_char',
		'escapeFormulaChar', 'escape_formula_char', 'escapedFormulaChar', 'escaped_formula_char'
	];

	;(function() {
		var p = CSVDialect.prototype;
		var name, _name,  root;
		var fn;
		var synonyms  = CSVDialect.__SYNONYMS__ = {
			preventCSVInjectionEscaper: [
				'preventCSVInjectionEscapeChar',
				'preventCsvInjectionEscaper', 'preventCsvInjectionEscapeChar',
				'escapeFormulasChar', 'escapedFormulasChar', 'escapeFormulaChar',
				'escapedFormulaChar'
			],
			preventCSVInjection: [
				'preventCsvInjection', 'preventFormulaInjection', 
				'escapeFormulas', 'escapedFormulas',
				'escapeFormula', 'escapedFormula',
				'escapeFormulae', 'escapedFormulae'
			],
			quoteAllStringValues: ['quoteAllStrings', 'quoteStrings', 'quoteAllTextValues', 'quoteAllTexts',
				'alwaysQuoteString', 'stringAlwaysQuoted', 'alwaysQuoteStrings', 'stringsAlwaysQuoted'],
			quoteAllValues: ['quoteAllFields'],
			nestedDelim: ['flattenDelim']
		};
		for (name in synonyms) {
			_name = name[0].toUpperCase() + name.substring(1);
			(synonyms[name]||[]).forEach(function(s) {
				root = s[0].toUpperCase() + s.substring(1);
				['get','is',  'set'].forEach(function(pref) {
					fn = p[pref + _name];
					if (fn) {
						p[pref + root] = fn;
					}
				});
			});
		}
	})();

	var csvDialectProps = [
		'openQuote', 'closeQuote', 'quote', 'encloser',
		'delim', 'delimiter', 'separator',
		'allowValueQuoting', 'quoteAllValues', 'quoteAllStringValues', 'dataTimeValueType',
		'allowUnicode', 'dateFormat', 'timeFormat',
		'noValueWithDelimiterChar', 'noValueWithQuoteChar',
		'acceptUnicode', 'supportUnicode',
		'acceptMultiLineValues', 'allowMultiLineValues', 'supportMultiLineValues',
		'shouldLastRecordHasLineBreak', 'shouldWriteHeaders', 
		'noValueWithQuoteChar', 'noNestedQuotes', 'nestedQuotes',
		'lineBreak', 'eol', 'endOfLine', 'withBOM',
		'nestedDelim',
		'refDelim', 'refOpener', 'refCloser',
		'indexOpener', 'indexCloser',
		'expandNestedObjects', 'expandArrayObjects', 'multiValuesFieldExpansion',
		'arrayValueFieldPrefix', 'quoteEscaper', 'quoteEscapeChar',
		'preventCSVInjectionEscaper', 'preventCSVInjectionEscapeChar',
		'preventCsvInjectionEscaper', 'preventCsvInjectionEscapeChar',
		'escapeFormulasChar', 'escape_formulas_char', 'escapedFormulasChar', 'escaped_formulas_char',
		'escapeFormulaChar', 'escape_formula_char', 'escapedFormulaChar', 'escaped_formula_char',

		'emptyStringValue','emptyQuotedStringValue','emptyStringBooleanValue',
		'trueStringValue', 'falseStringValue', 'undefinedStringValue', 'nullStringValue',

		'alwaysQuoteUndefinedStringValues', 'alwaysQuoteNullStringValues', 
		'alwaysQuoteNumberStringValues', 'alwaysQuoteBooleanStringValues',
		'alwayaQuoteEmptyStringValue'
	];

	if (typeof defProps === 'function') {
		defProps(CSVDialect.prototype, csvDialectProps);
	} else {
		Object.defineProperties(CSVDialect.prototype, _getPropDefs(CSVDialect.prototype, csvDialectProps));
	}

	function _getSetter(field, obj) {
		var fn = function _set(val) {
			this[_set._key] = val;
			return this;
		};
		fn._key = '__' + field + '_';
		return fn;
	}

	function _getGetter(field, obj) {
		var fn = function _get() {
			return this[_get._key];
		};
		fn._key = '__' + field + '_';
		return fn;
	}

	function _getPropDefs(obj, csvDialectProps) {
		return csvDialectProps.reduce(function (defs, field) {
			var root;
			if (typeof field === 'string') {
				root = field[0].toUpperCase() + field.substring(1);
				defs[field] = {
					name: field,
					get: obj['get' + root] || obj['is' + root] || _getGetter(field, obj),
					set: obj['set' + root] || _getSetter(field, obj),
					enumerable: true,
					configurable: true
				};
			}
			return defs;
		}, {});
	}


	function lpad(val, length) {
		var str = '' + val;
		var i = length - str.length;
		for (; i > 0; i--) {
			str = '0' + str;
		}
		return str;
	}

	function rpad(val, length, padChar) {
		var str = '' + val;
		var i = length - str.length;
		padChar = padChar || '0';
		for (; i > 0; i--) {
			str += padChar;
		}
		return str;
	}

	ADataDialect.randomYear = randomYear;

	SQLDialect.randomYear = randomYear;

	MsAccessDialect.randomYear = randomYear;

	ADataDialect.lpad = lpad;

	SQLDialect.lpad = lpad;

	MsAccessDialect.lpad = lpad;

	ADataDialect.rpad = rpad;

	SQLDialect.rpad = rpad;

	MsAccessDialect.rpad = rpad;

	DataDialect.rpad = rpad;

	DataDialect.lpad = lpad;



	ADataDialect.padLeft = lpad;

	SQLDialect.padLeft = lpad;

	MsAccessDialect.padLeft = lpad;

	ADataDialect.padRight = rpad;

	SQLDialect.padRight = rpad;

	MsAccessDialect.padRight = rpad;

	DataDialect.padRight = rpad;

	DataDialect.padLeft = lpad;



	if ((typeof DataGenerator !== 'undefined') && (DataGenerator !== null)) {
		if (!DataGenerator.defaulSQLDialect)
			DataGenerator.defaulSQLDialect = new SQLDialect();
		if (!DataGenerator.defaulDataDialect) {
			DataGenerator.defaulDataDialect = new DataDialect();
		}
		SQLDialect.BUILTIN_MAIN_INTEGER_TYPES = DataGenerator.BUILTIN_MAIN_INTEGER_TYPES;

		SQLDialect.BUILTIN_INTEGER_TYPES = DataGenerator.BUILTIN_INTEGER_TYPES;

		SQLDialect.BUILTIN_STRING_TYPE_NAMES = DataGenerator.BUILTIN_STRING_TYPE_NAMES;

		SQLDialect.BUILTIN_NUMBER_TYPES_MAP = DataGenerator.BUILTIN_NUMBER_TYPES_MAP;

		SQLDialect.BUILTIN_NUMBER_TYPE_INTERVALS = DataGenerator.BUILTIN_NUMBER_TYPE_INTERVALS;
		/**
		 * 
		 * @property {Object} SQLDialect.MYSQL_INTEGER_TYPES Data base integer intervals with lower cased keys data types.
		 */
		SQLDialect.MYSQL_INTEGER_TYPES = MYSQL_INTEGER_TYPES = DataGenerator.MYSQL_INTEGER_TYPES;
		/**
		 * 
		 * @property {Object} SQLDialect.MYSQL_UPPER_INTEGER_TYPES Data base integer intervals with upper cased keys data types.
		 */
		SQLDialect.MYSQL_UPPER_INTEGER_TYPES = DataGenerator.MYSQL_UPPER_INTEGER_TYPES;

		SQLDialect.regexEscape = regexEscape;

		SQLDialect.toBool = toBool;

		SQLDialect.coalesce = coalesce;



		ADataDialect.BUILTIN_MAIN_INTEGER_TYPES = DataGenerator.BUILTIN_MAIN_INTEGER_TYPES;

		ADataDialect.BUILTIN_INTEGER_TYPES = DataGenerator.BUILTIN_INTEGER_TYPES;

		ADataDialect.BUILTIN_STRING_TYPE_NAMES = DataGenerator.BUILTIN_STRING_TYPE_NAMES;

		ADataDialect.BUILTIN_NUMBER_TYPES = DataGenerator.BUILTIN_NUMBER_TYPES;

		ADataDialect.BUILTIN_NUMBER_TYPE_INTERVALS = DataGenerator.BUILTIN_NUMBER_TYPE_INTERVALS;
		/**
		 * 
		 * @property {Object} ADataDialect.MYSQL_INTEGER_TYPES Data base integer intervals with lower cased keys data types.
		 */
		ADataDialect.MYSQL_INTEGER_TYPES = DataGenerator.MYSQL_INTEGER_TYPES;
		/**
		 * 
		 * @property {Object} ADataDialect.MYSQL_UPPER_INTEGER_TYPES Data base integer intervals with upper cased keys data types.
		 */
		ADataDialect.MYSQL_UPPER_INTEGER_TYPES = DataGenerator.MYSQL_UPPER_INTEGER_TYPES;

		ADataDialect.regexEscape = regexEscape;

		ADataDialect.toBool = toBool;

		ADataDialect.coalesce = coalesce;
	}

	function isDataType(str) {
		return /^((?:var)?char2?|string|text|clob|number|numeric|decimal|float|real|double|long double|double double|(unsigned($|[ \t]*?((?:big_?)?int(eger)|byte|short|long([ \t]long)?)?)|(tiny|small|medium|long)[ \t]*int(eger)?([ \t]+unsigned)?|u?int(?:\d+)?|ubyte|ushort|ulong|ubigint)|blob|name|email|tel|uuid|uid|oid|ip(?:v[46])?|url|urn|phonenum|credit[_-]?card[_-]?num)$/.test(str.toLowerCase());
	}

	ADataDialect.isDataType = isDataType;

	CSVDialect.isDataType = isDataType;


	var classes = [ADataDialect, DataDialect, CSVDialect, SQLDialect, SQLLiteDialect, OracleDialect, MySQLDialect, MsAccessDialect, SQLServerDialect, TSQLDialect, PgSQLDialect];
	classes.forEach(function (Cls) {
		Cls.__CLASS_NAME__ = Cls.prototype.__CLASS_NAME__ = Cls.__CLASS_NAME__ || Cls.name;
		Cls.__CLASS__ = Cls.prototype.__CLASS__ = Cls;
		Cls.__NAMESPACE_NAME__ = 'SereniX.data';
		Cls.__FULL_CLASS_NAME__ = Cls.__CLASS_FULL_NAME__ = Cls.__FULL_NAME__ = 'SereniX.data.' + Cls.__CLASS_NAME__;
		Cls.__AUTHOR__ = 'Marc KAMGA Olivier';
		Cls.__SINCE__ = '2024 August';
		Cls.__VERSION__ = '1.0.0';
		Cls.getPropDefs = _getPropDefs;

		Cls.isStringDataType = Cls.isStringDataType||isStringDataType;

		Cls.matchStringDataType = Cls.matchStringDataType||matchStringDataType;

		Cls.isFloatingPointDataType = Cls.isFloatingPointDataType||isFloatingPointDataType;

		Cls.isIntegerDataType = Cls.isIntegerDataType||isIntegerDataType;

		Cls.checkNumberDataType = Cls.checkNumberDataType||checkNumberDataType;
	});
	if (typeof SereniX.data.addElements === 'function') {
		SereniX.data.addElements(classes);
	} else {
		classes.forEach(function (Cls) {
			SereniX.data[Cls.__CLASS_NAME__] = Cls;
		});
	}

})();
