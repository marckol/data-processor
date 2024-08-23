if (typeof SereniX === 'undefined') {
	SereniX = {data: {}};
} else if ((typeof SereniX.Namespace === 'function') && (typeof SereniX.Namespace.ns === 'function')) {
	SereniX.Namespace.ns('SereniX.data');
} else if (!SereniX.data) {
	SereniX.data = {};
}


if (typeof coalesce !== 'function') {
	coalesce = function(o, fields, defaultValue) {
		var i = 0, n;
		var val;
		if ((typeof fields === 'string') || (fields instanceof String)) {
			fields = fields.split(/\s*\|\s*/);
		}
		for (n = fields.length; i < n; i++) {
			val = o[fields[i]];
			if (val != undefined)
				return val;
		}
		return defaultValue;
	}
}

;(function(root, name, factory) {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([name], factory);
    } else {
        root[name] = factory();
    }    
})(this, 'DataIO', function() {	
	

	var names = 'Type	Storage (Bytes)	Minimum Value Signed	Minimum Value Unsigned	Maximum Value Signed	Maximum Value Unsigned'.split(/\t/);

	var mysqlUpperIntegerTypes = (`TINYINT	1	-128	0	127	255
SMALLINT	2	-32768	0	32767	65535
MEDIUMINT	3	-8388608	0	8388607	16777215
INT	4	-2147483648	0	2147483647	4294967295\n`
+ 'BIGINT	8	' + (-1*Math.pow(2, 63)) + '	0	' + (Math.pow(2, 63)-1) + '	' + (Math.pow(2, 64)-1)).split(/\n/).reduce(function(accumulator, line) {
		var signed = {};
		var unsigned = {};
		line.trim().split(/\t/).forEach(function(str, i) {
			if (i === 0) {
				signed.name = str;
				unsigned.name = str + ' UNSIGNED';
			} else if (i === 1) {
				signed.storage = unsigned.storage = str;
			} else if (i === 2) {
				signed.min = parseFloat(str, 10);
			} else if (i === 3) {
				unsigned.min = parseFloat(str, 10);
			} else if (i === 4) {
				signed.max = parseFloat(str, 10);
			} else if (i === 5) {
				unsigned.max = parseFloat(str, 10);
			}
		}, {});
		accumulator[signed.name] = signed;
		accumulator[unsigned.name] = unsigned;
		return accumulator;
	}, {});

	var mysqlIntegerTypes = (function() {
		var types = {};
		var name;
		for (name in mysqlUpperIntegerTypes) {
			types[name.toLowerCase()] = mysqlUpperIntegerTypes[name];
		}
		return types;
	})();

	var SERENIX_NUMBER_TYPES = [
        "bit",
        "byte",
        "ubyte",
        "signed byte",
        "unsigned byte",
        "short",
        "short int",
        "short integer",
        "signed short",
        "signed short int",
        "signed short integer",
        "unsigned short",
        "unsigned short int",
        "unsigned short integer",
        "int",
        "integer",
        "signed",
        "signed int",
        "signed integer",
        "unsigned",
        "unsigned int",
        "unsigned integer",
        "long",
        "long int",
        "long integer",
        "signed long",
        "signed long int",
        "unsigned long",
        "unsigned long int",
        "long long",
        "long long int",
        "signed long long",
        "signed long long int",
        "unsigned long long",
        "unsigned long long int",
        "float",
        "double",
        "long double",
        "signed long double",
        "unsigned long double",
        "number",
        "numeric",
        "decimal",
        "uint",
        "ulong",
        "ufloat",
        "ubyte",
        "ushort",
        "udouble",
        "uldouble",
        "int4",
        "int8",
        "int16",
        "uint16",
        "int32",
        "uint32",
        "int64",
        "uint64",
        "uint16",
        "size"
    ];

	/**
	 * 
	 * @type type
	 */    
	var SERENIX_NUMBER_TYPES_MAP = {
		"bit": "bit",
		"byte": "byte",
		"signed byte": "byte",
		"byte char": "byte",
		"b": "byte",
		"unsigned byte": "unsigned byte",
		"unsignedbyte": "unsigned byte",
		"ubyte": "unsigned byte",
		"ub": "unsigned byte",
		"short": "short",
		"short int": "short",
		"signed short": "short",
		"signed short int": "short",
		"unsigned short": "unsigned short",
		"unsigned short int": "unsigned short",
		"us": "unsigned short",
		"int": "int",
		"i": "int",
		"signed": "int",
		"signed int": "int",
		"signedint": "int",
		"unsigned": "unsigned int",
		"unsigned integer": "unsigned int",
		"unsignedinteger": "unsigned int",
		"uint": "unsigned int",
		"ui": "unsigned int",
		"unsigned int": "unsigned int",
		"unsignedint": "unsigned int",
		"long": "long",
		"long int": "long",
		"longint": "long",
		"l": "long",
		"li": "long",
		"signed long": "long",
		"signed long int":"long",
		"signed long integer":"long",
		"unsigned long": "unsigned long",
		"signedlong": "long",
		"signedlongint":"long",
		"signed longint":"long",
		"signedlonginteger":"long",
		"signed longinteger":"long",
		"longinteger":"long",
		"unsignedlong": "unsigned long",
		"ulong": "unsigned long",
		"ul": "unsigned long",
		"unsigned long int": "unsigned long",
		"long long": "long long",
		"long long int": "long long",
		"long long integer": "long long",
		"signed long long": "long long",
		"signed long long int": "long long",
		"signed long long integer": "long long",
		"unsigned long long": "unsigned long long",
		"unsignedlonglong": "unsigned long long",
		"ull": "unsigned long long",
		"unsigned long long int": "unsigned long long",
		"float": "float",
		"real": "float",
		"decimal": "float",
		"numeric" : "number",
		"number" : "number",
		"nombre": "number",
		"double": "double",
		"long double": "long double",
		"f": "float",
		"d": "double",
		"ld": "long double",
		"unsigned float": "unsigned float",
		"unsignedfloat": "unsigned float",
		"signedfloat": "signed float",
		"ufloat": "unsigned float",
		"uf": "unsigned float",
		"unsigned double": "unsigned double",
		"signeddouble": "signed double",
		"unsigneddouble": "unsigned double",
		"udouble": "unsigned double",
		"ud": "unsigned double",
		"unsigned long double": "unsigned long double",
		"uld": "unsigned long double",
		"uldouble": "unsigned long double",            
		"uint4" : "unsigned int",
		"int8" : "byte",
		"uint8" : "unsigned byte",
		"int16" : "short",
		"uint16" : "unsigned short",
		"int32" : "int",
		"integer32" : "int",
		"uint32" : "unsigned int",
		"int64" : "long long",
		"integer64" : "long long",
		"uint64" : "unsigned long long",
		'short integer' : 'short',
		'signed short integer' : 'short',
		'unsigned short integer' : 'unsigned short',
		'integer' : 'int',
		'signed integer' : 'int',
		'long integer' : 'long',
		'signed long double' : 'long double',
		'ushort' : 'unsigned short',
		'size' : 'unsigned int'
	};    
	var SERENIX_MAIN_INTEGER_TYPES = [
			"byte",
			"unsigned byte",
			"short",
			"unsigned short",
			"int",
			"long",
			"unsigned long",
			"long long",
			"unsigned long long",
			"uint",
			"ulong",
			"ubyte",
			"ushort",
			"int4",
			"uint4",
			"int8",
			"uint8",
			"int32",
			"uint32",
			"int16",
			"uint16",
			"int64",
			"uint64",
			"size"
		];
	var SERENIX_INTEGER_TYPES = [
			"byte",
			"signed byte",
			"unsigned byte",
			"short",
			"short int",
			"short integer",
			"signed short",
			"signed short int",
			"signed short integer",
			"unsigned short",
			"unsigned short int",
			"unsigned short integer",
			"int",
			"integer",
			"signed",
			"signed int",
			"signed integer",
			"unsigned",
			"unsigned int",
			"unsigned integer",
			"long",
			"long int",
			"long integer",
			"signed long",
			"signed long int",
			"unsigned long",
			"unsigned long int",
			"long long",
			"long long int",
			"signed long long",
			"signed long long int",
			"unsigned long long",
			"unsigned long long int",
			"uint",
			"ulong",
			"ubyte",
			"ushort",
			"int4",
			"int8",
			"uint32",
			"uint16",
			"uint64",
			"size"
		];


	/**
	 * 
	 * @type {Object}
	 */
	var SERENIX_NUMBER_TYPE_INTERVALS = {
		"bit" : { min: 0, max: 1 },
		"byte" : { min: -128, max: 127 },
		"signed byte" : { min: -128, max: 127 },
		"unsigned byte" : { min: 0, max: 255 },
		"positive byte" : { min: 1, max: 255 },
		"ubyte" : { min: 0, max: 255 },
		"short" : { min: -32768, max: 32767 }, //-32768 to 32767
		"short int" : { min: -32768, max: 32767 }, //-32768 to 32767
		"signed short" : { min: -32768, max: 32767 }, //-32768 to 32767
		"signed short int" : { min: -32768, max: 32767 }, //-32768 to 32767
		"unsigned short" : { min: 0, max: 65535 },
		"unsigned short int" : { min: 0, max: 65535 },
		"positive short" : { min: 1, max: 65535 },
		"positive short int" : { min: 1, max: 65535 },
		"int" : { min: -2147483648, max: 2147483647 }, //-2147483648 to 2147483647
		"signed" : { min: -2147483648, max: 2147483647 }, //-2147483648 to 2147483647
		"signed int" : { min: -2147483648, max: 2147483647 }, //-2147483648 to 2147483647
		"signed integer" : { min: -2147483648, max: 2147483647 }, //-2147483648 to 2147483647
		"unsigned" : { min: 0, max: 4294967295 },
		"unsigned int" : { min: 0, max: 4294967295 },
		"positive int" : { min: 0, max: 4294967295 },
		"unsigned integer" : { min: 0, max: 4294967295 },
		"uint" : { min: 0, max: 4294967295 },
		"long" : { min: -4294967296, max: 4294967295 },
		"long int" : { min: -4294967296, max: 4294967295 },
		"long integer" : { min: -4294967296, max: 4294967295 },
		"signed long" : { min: -4294967296, max: 4294967295 },
		"signed long int" : { min: -4294967296, max: 4294967295 },
		"signed long integer" : { min: -4294967296, max: 4294967295 },
		"unsigned long" : { min: 0, max: 9223372036854775807 },
		"positive long" : { min: 1, max: 9223372036854775807 },
		"unsigned long int" : { min: 0, max: 9223372036854775807 },
		"unsigned long integer" : { min: 0, max: 9223372036854775807 },
		"long long" : { min : -9223372036854770808, max: 9223372036854775807}, //-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
		"int64": { min : -9223372036854770808, max: 9223372036854775807}, //-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
		"long long int" : { min : -9223372036854770808, max: 9223372036854775807},
		"long long integer" : { min : -9223372036854770808, max: 9223372036854775807},
		"signed long long" : { min : -9223372036854770808, max: 9223372036854775807},
		"signed long long int" : { min : -9223372036854770808, max: 9223372036854775807},
		"signed long long integer" : { min : -9223372036854770808, max: 9223372036854775807},
		"unsigned long long" : { min : 0, max: 18446744073709551615}, //  
		"unsigned long long int" : { min : 0, max: 18446744073709551615},
		"unsigned long long integer" : { min : 0, max: 18446744073709551615},
		"uint64" : { min : 0, max: 18446744073709551615},
		"float" : { min: 3.4e-38, max: 3.4e+38},
		"unsigned float": { min: 0, max: 6.8e+38 },
		"double" :{ min: 1.7e-308, max: 1.7e+308 },
		"unsigned double" : {min: 0, max: 3.14e+308},
		"long double" :{ min: 1.7e-308, max: 1.7e+308 },
		"unsigned long double" : { min: 0}
	};

	/**
	 * 
	 * <p>'text', 'html-text', 'xml-text', 'yaml-text', 'json-text' and 'code' are 
	 * multi lines text</p>
	 * @type Array&lt;String&gt;
	 */
	var SERENIX_STRING_TYPE_NAMES = [ 
		'string', //single line text
		'text', //multi lines text
		'html-text', //multi lines text
		'xml-text', //multi lines text
		'yaml-text', //multi lines text
		'json-text', //multi lines text
		'html_text', //multi lines text
		'xml_text', //multi lines text
		'yaml_text', //multi lines text
		'json_text', //multi lines text
		'htmltext', //multi lines text
		'xmltext', //multi lines text
		'yamltext', //multi lines text
		'jsontext', //multi lines text
		'code', //multi lines text
		'password', //single line text
		'email', //single line text
		'tld',
		
		'tel',
		'telephon',
		
		'telnum',
		'telephonnum',
		'tel_num',
		'telephon_num',
		
		
		'telnumber',
		'telephonnumber',
		'tel_number',
		'telephon_number',
		
		'phonenumber',
		'phone_number',
		
		'phonenum',
		'phone_num',
		
		'url',
		'uri',
		'urn',
		'path',
		'filename',
		'propertyname',
		'property name',
		'property_name',
		'namespace',
		'ipv4',
		'ipv6',
		'creditcard',
		'credit card',
		'credit_card',
		'uuid',

		'uuid1',
		'uuid3',
		'uuid4',
		'uuid5',
		'uuid6',

		'uuidv1',
		'uuidv3',
		'uuidv4',
		'uuidv5',
		'uuidv6',

		'niu',
		'oid',
		'id',
		'name',
		'company_name',
		'product_name',
		'full_name',
		'family_name',
		'fullname',
		'familyname',
		'first_name',
		'firstname',
		'last_name',
		'lastname',
		'surname',
		
		'person_name',
		'personname',
		'patient_name',
		'patientname',
		'country_name',
		'countryname',
		'city_name',
		'cityname',
		'town_name',
		'townname',
		'streetname',
		'street_name',
		
		'streetnum',
		'street_num',
		
		'streetnumber',
		'street_number',
		
		'zipcode',
		'zip_code',
		
		'pobox',
		'po_box'
	];
	var SERENIX_STRING_TYPE_DB_NAMES = {
		'string': 'VARCHAR(255)', //single line text
		'text': 'TEXT', //multi lines text
		'html-text': 'TEXT', //multi lines text
		'xml-text': 'TEXT', //multi lines text
		'yaml-text': 'TEXT', //multi lines text
		'json-text': 'TEXT', //multi lines text
		'html_text': 'TEXT', //multi lines text
		'xml_text': 'TEXT', //multi lines text
		'yaml_text': 'TEXT', //multi lines text
		'json_text': 'TEXT', //multi lines text
		'htmltext': 'TEXT', //multi lines text
		'xmltext': 'TEXT', //multi lines text
		'yamltext': 'TEXT', //multi lines text
		'jsontext': 'TEXT', //multi lines text
		'code': 'TEXT', //multi lines text
		'password': 'VARCHAR(16)', //single line text
		'email': 'VARCHAR(255)', //single line text
		'tld': 'VARCHAR(16)',
		'tel': 'VARCHAR(16)',
		'telephon': 'VARCHAR(16)',
		
		'telnum': 'VARCHAR(16)',
		'telephonnum': 'VARCHAR(16)',
		'tel_num': 'VARCHAR(16)',
		'telephon_num': 'VARCHAR(16)',
		
		
		'telnumber': 'VARCHAR(16)',
		'telephonnumber': 'VARCHAR(16)',
		'tel_number': 'VARCHAR(16)',
		'telephon_number': 'VARCHAR(16)',
		
		'phonenumber': 'VARCHAR(16)',
		'phone_number': 'VARCHAR(16)',
		
		'phonenum': 'VARCHAR(16)',
		'phone_num': 'VARCHAR(16)',
		
		
		'url': 'VARCHAR(255)',
		'uri': 'VARCHAR(255)',
		'urn': 'VARCHAR(255)',
		'path': 'VARCHAR(255)',
		'filename': 'VARCHAR(255)',
		'propertyname': 'VARCHAR(255)',
		'property name': 'VARCHAR(255)',
		'property_name': 'VARCHAR(255)',
		'namespace': 'VARCHAR(255)',
		'ipv4': 'VARCHAR(11)',
		'ipv6': 'VARCHAR(32)',
		'creditcard': 'VARCHAR(16)',
		'credit card': 'VARCHAR(16)',
		'credit_card': 'VARCHAR(16)',
		'uuid': 'VARCHAR(20)',

		'uuid1': 'VARCHAR(20)',
		'uuid3': 'VARCHAR(20)',
		'uuid4': 'VARCHAR(20)',
		'uuid5': 'VARCHAR(20)',
		'uuid6': 'VARCHAR(20)',

		'uuidv1': 'VARCHAR(20)',
		'uuidv3': 'VARCHAR(20)',
		'uuidv4': 'VARCHAR(20)',
		'uuidv5': 'VARCHAR(20)',
		'uuidv6': 'VARCHAR(20)',

		'niu': 'VARCHAR(20)',
		'oid': 'VARCHAR(50)',
		'id': 'VARCHAR(25)',
		'name': 'VARCHAR(60)',
		'company_name': 'VARCHAR(60)',
		'product_name': 'VARCHAR(40)',
		'full_name': 'VARCHAR(100)',
		'family_name': 'VARCHAR(60)',
		'fullname': 'VARCHAR(100)',
		'familyname': 'VARCHAR(60)',
		'first_name': 'VARCHAR(60)',
		'firstname': 'VARCHAR(60)',
		'last_name': 'VARCHAR(60)',
		'lastname': 'VARCHAR(60)',
		'surname': 'VARCHAR(60)',
		
		'person_name': 'VARCHAR(50)',
		'personname': 'VARCHAR(50)',
		'patient_name': 'VARCHAR(50)',
		'patientname': 'VARCHAR(50)',
		'country_name': 'VARCHAR(50)',
		'countryname': 'VARCHAR(50)',
		'city_name': 'VARCHAR(50)',
		'cityname': 'VARCHAR(50)',
		'town_name': 'VARCHAR(50)',
		'townname': 'VARCHAR(50)',
		'streetname': 'VARCHAR(150)',
		'street_name': 'VARCHAR(150)',
		
		'streetnum': 'VARCHAR(5)',
		'street_num': 'VARCHAR(5)',
		
		'streetnumber': 'VARCHAR(5)',
		'street_number': 'VARCHAR(5)',
		
		'zipcode': 'VARCHAR(5)',
		'zip_code': 'VARCHAR(5)',
		
		'pobox': 'VARCHAR(10)',
		'po_box': 'VARCHAR(10)',
	};
	var chars = {};

	var printableAsciiChars = [];

	var lowerLetters = [];

	var upperLetters = [];

	var digits = "0123456789".split("");

	var chars = { 
		digits: digits,
		lowerAlpha: lowerLetters,
		upperAlpha: upperLetters,
		printableAscii: printableAsciiChars
	};

	;(function() {

		//Here is an example on how to generate an array with all the lowercase letters:

		//["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
		for (var i=97; i<123; i++)
			lowerLetters.push(String.fromCharCode(i));
		for (var i=97; i<123; i++)
			upperLetters.push(String.fromCharCode(i).toUpperCase());

		//Edit to include all ascii printable characters per Aaron recommendation:

		//[" ", "!", """, "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~"]
		for (var i=32; i<127; i++)
		  printableAsciiChars.push(String.fromCharCode(i));
	})();

	function randomChars(count, chars) {
		var n;
		var i = 0;
		var str = '';
		
		chars = chars||printableAsciiChars;
		n = chars.length - 1;
		
		for (; i < count; i++) {
			str += chars[Math.floor(Math.random()*n)];
		}
		return '`' + str + '`';
	}
	
	var stringGenerators = {};
	

	function _randomFloat(def, size, precision) {
		var max;
		var val;
		if (precision >= 0) {
			if (size > 0) {
				max = Math.pow(10, size) -1;
				max = '' + max;
				max = parseFloat(max, 10);
			} else {
				max = Math.floor(def.max);
			}
			max += '.' + (Math.pow(10, precision) -1);
			max = parseFloat(parseFloat(max, 10).toFixed(precision));
			if (max > def.max) {
				max = def.max;
			}
		} else if (size > 0) {
			max = (Math.pow(10, size) -1) + '.' + (precision = Math.pow(10, Math.round(Math.floor(Math.random()*600)/100)) -1);
			max = parseFloat(max, 10);
			if (max > def.max) {
				max = def.max;
			}
		} else {
			max = def.max;
		}
		
		return def.min + (Math.random()*(max - def.min));;
	}

	function _randomInteger(def, size) {
		var val = def.min + Math.floor((def.max - def.min)*Math.random());
		if (size > 0) {
			var abs = Math.abs(val);
			if (abs > Math.pow(10, size) - 1) {
				abs = Math.pow(10, size) - 1;
			}
			val = (val < 0 ? - 1 : 1)*abs;
		}
		return val;
	}

	var sequences = {};
	var columnCheckRe = /([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:(>=?|<[=>]?|!=)\s*(\d+(?:\.\d+)?|\.\d+)|\s+BETWEEN\s+(\d+(?:\.\d+)?|\.\d+)\s+AND\s+(\d+(?:\.\d+)?|\.\d+)|\s+(?:(NOT)\s+)?(LIKE|SIMILAR TO|ILIKE|RLIKE)\s+(?:"(%)?([^%"]*)(%)?"|'(%)?([^%']*)(%)?'|`(%)?([^%`]*)(%)?`|([^%"]*)(%)?"|'([^%']*)(%)?'|`([^%`]*)(%)?`)|\s+IN\s*\[(?:(\d+(?:\.\d+)?|\.\d+)|"(\.+)"|'(\.+)'|`(\.+)`(?:\s*,\s*(?:(\d+(?:\.\d+)?|\.\d+)|([a-zA-Z_][a-zA-Z0-9_]*)|"(\.+)"|'(\.+)'|`(\.+)`)))\])/;
	var columnConstraintsRe = /(?:(?:FOREIGN\s+KEY\s+)?REFERENCES\s+(?:([a-zA-Z_][a-zA-Z0-9_]*)(?:\.([a-zA-Z_][a-zA-Z0-9_]*))?)\s*\(\s*(?:([a-zA-Z_][a-zA-Z0-9_]*)|"(\.+)"|'(\.+)'|`(\.+)`)\s*\)\s*|(?:CONSTRAINT\s+([A-Z_][A-Z0-9_]*)\s+)?CHECK\(([^\(\)]+)\))/ig;
	function parseColumnConstraints(constraintsString) {
		var constraints = {};
		var match;
		var check;
		var condition;
		var name;
		
		while ((match = columnConstraintsRe.exec(constraintsString))) {
			if (match[1]) {
				constraints.foreignKey = {
					references: match[2] ? {schema: match[1], table: match[2]} : {table: match[1]},
					on: match[3]||match[4]||match[5]||match[6]
				}
			} else if ((check = match[8])) {
				name = match[7];
				if (match = columnCheckRe.exec(check)) {
					condition = {left: match[1]};
					if (match[1]) {
						condition.operator = match[2].toUpperCase();
						condition.right = match[3];
					} else if (match[4]) {
						condition.operator = 'BETWEEN';
						condition.min = match[4];
						condition.max = match[5];
					} else if (match[7]) {
						condition.operator = (match[6] ? 'NOT ' : '') + match[7].toUpperCase();
						condition.right = {
							startsWith : !!(match[8]|match[11]|match[14]),
							value : match[9]|match[12]|match[15]||match[17]||match[19]||match[21]||'',
							endsWith: !!(match[10]|match[13]|match[16]||match[18]||match[20]||match[22])
						};
					}
					constraints.check = name ? {check: check, name: name, condition: condition} : {check: check, condition: condition};
				} else {
					constraints.check = name ? {check: check, name: name} : {check: check};
				}
			}
		}
		return constraints;
	}
	
	function _generateValueBetween(col, fullTableName, constraint, dataDialect, maxTrials, boundsValueMaxTrials) {
		var val;
		var condition = constraint.condition||constraint.range||constraint;
		var dataType = col.dataType;
		var min = condition.min;
		var max = condition.max;
		var count = 1;
		maxTrials = maxTrials||5;
		if (!boundsValueMaxTrials) {
			boundsValueMaxTrials = maxTrials + 5;
		}
		if (/^(date(time)?|time)$/.test(dataType.toLowerCase())) {
			if (typeof min === 'string') {
				min = (new Date(min)).getTime();
			}
			if (typeof max === 'string') {
				max = (new Date(max)).getTime();
			}
			for (;;) {
				val = _generateValue(col, fullTableName, dataDialect);
				if ((val.getTime() >= min) && (val.getTime() <= max)) {
					return val;
				}
				if ((constraint.isNull || (constraint.isNull == undefined)) && count === maxTrials) {
					return null;
				} else if (count === boundsValueMaxTrials) {
					return new Date(Math.floor(Math.random()*10) <= 5 ? min : max);
				}
				count++;
			}
		}
		for (;;) {
			val = _generateValue(col, fullTableName, dataDialect, constraint.condition||constraint);
			if ((val >= min) && (val <= max)) {
				return val;
			}
			if ((constraint.isNull || (constraint.isNull == undefined)) && count === maxTrials) {
				return null;
			} else if (count === boundsValueMaxTrials) {
				return Math.floor(Math.random()*10) <= 5 ? min : max;
			}
			count++;
		}
	}
	
	function _generateValueNotBetween(col, fullTableName, constraint, dataDialect,  maxTrials) {
		var val;
		var condition = constraint.condition||constraint.range||constraint;
		var min = condition.min;
		var max = condition.max;
		var count = 1;
		var minValue;
		var dataType = col.dataType;
		var dtyp;
		
		maxTrials = maxTrials||5;
		if (/^(date(time)?|time)$/.test(dtyp = dataType.toLowerCase())) {
			if (typeof min === 'string') {
				min = (new Date(min)).getTime();
			}
			if (typeof max === 'string') {
				max = (new Date(max)).getTime();
			}
			for (;;) {
				val = _generateValue(col, fullTableName, dataDialect);
					if ((val.getTime() < min) || (val.getTime() > max)) {
					return val;
				}
				if ((constraint.isNull || (constraint.isNull == undefined)) && count === maxTrials) {
					return null;
				} else if (count === boundsValueMaxTrials) {
					epsilon = dtyp === 'date' ? 24*60*60*1000: 1;
					minValue = Math.floor(Math.random()*10) <= 5;
					return new Date(minValue ? min - epsilon : max + epsilon);
				}
				count++;
			}
		}
		for (;;) {
			val = _generateValue(col, fullTableName, dataDialect);
			if ((val < min) || (val > max)) {
				return val;
			}
			if ((constraint.isNull || (constraint.isNull == undefined)) && count === maxTrials) {
				return null;
			} else if (count === boundsValueMaxTrials) {
				epsilon = (SERENIX_INTEGER_TYPES.indexOf(dataType) >= 0) || (precision === 0 ) ? 1 : 
					SERENIX_NUMBER_TYPES_MAP[dataType] ? parseFloat('0.' + (function() {
						var str = '';
						for (var i = precision -1; i; i++) {
							str += '0';
						}
						return str;
					})() +'1') : null;
				minValue = Math.floor(Math.random()*10) <= 5;
				val = minValue ? min : max;
				if (typeof min === 'string') {
					return val.substring(0, val.length - 1);
				}
				if (epsilon === null) {
					
				}
				return minValue ? min - epsilon : max + epsilon;
			}
			count++;
		}
	}

	function _getBounds(def, $1, $2) {
		var min, max;
		if (($1 == undefined) && ($2 === undefined)) {
			return def;
		}
		
		if (isPlainObj($1)) {
			var bounds = {};
			min = coalesce($1, ['min', 'minimum', 'minValue', 'minVal', 'minimumValue', 'minimumVal']);
			max = coalesce($1, ['max', 'maximum', 'maxValue', 'maxVal', 'maximumValue', 'maximumVal']);
			if ((min == undefined) && (max == undefined)) {
				return def;
			}
			bounds.min = min;
			bounds.max = max;
			return bounds;
		} else if (typeof $1 === 'number') {
			var bounds = {min: $1};
			if (typeof $2 === 'number') {
				bounds.max = $2;
			}
			return bounds;
		}
		return def;
	}
	
	var defaultStringSize = 100;
	
	var translateStringDataTypeRe = new RegExp("(" + SERENIX_STRING_TYPE_NAMES.slice().sort(function(x, y) {
		return x.length > y.length ? -1 : x.length < y.length ? -1 : 0;
	}).join('|') + ')$');
	
	function _generateValue(col, fullTableName, dataDialect, $1, $2) {
		var def;
		var val;
		var dataType;
		var colName = col.name;
		var size = col.size;
		var dtyp;
		switch((dataType = col.dataType).toLowerCase()) {
			case 'number':
			case 'decimal':
			case 'numeric':
				def = SERENIX_NUMBER_TYPE_INTERVALS[(col.unsigned ? "unsigned " : "") + "float"];
				val = _randomFloat(_getBounds(def, $1, $2), size, col.precision);
				break;
			case 'int':
			case 'integer':
				if (col.autoIncrement) {
					if (!sequences[fullTableName]) {
						val = sequences[fullTableName] = 1;
					} else {
						val = ++sequences[fullTableName];
					}
					def = mysqlUpperIntegerTypes['INT UNSIGNED'];
					if (val > def.max) {
						throw new Error('Value out of bounds: ' + val);
					}
				} else {
					if (col.unsigned) {
						def = mysqlUpperIntegerTypes['INT UNSIGNED'];
					} else {
						def = mysqlUpperIntegerTypes['INT'];
					}
					val = _randomInteger(_getBounds(def, $1, $2), size);
				}
				break;
			case 'float':
			case 'double':					
				def = SERENIX_NUMBER_TYPE_INTERVALS[(unsigned ? "unsigned " : "") + dataType.toLowerCase()];
				val = _randomFloat(_getBounds(def, $1, $2), size, col.precision);
				break;
			case 'varchar':
			case 'varchar2':				
				if ((match = translateStringDataTypeRe.exec(colName||''))) {
					dtyp = /([^\(\)]+)(?:\((\d+)\))?$/.exec(def);
					val = _generateStringValue(dtyp[1], typeof size !== 'number' ? dtyp[2] ? parseInt(dtyp[2], 10) : defaultStringSize : size);
				} else if (size < 0) {
					throw new Error('Incorrect varchar data type size: ' + size);
				} else {
					val = randomChars(Math.floor(Math.random()*size));
				}
				break;
			case 'date':
				try {
					val = dataDialect.randomDate();
				} catch (err) {
					console.log(err);
					throw err;
				}
				break;
			case 'datetime':
			case 'date_time':
				val = dataDialect.randomDateTime();
				break;
			case 'time':
				val = dataDialect.randomTime();
				break;
			case 'timestamp':
				val = dataDialect.randomTimestamp();
				break;
			case 'year':
				val = dataDialect.randomYear();
				break;
			case 'char':
				if (size < 0) {
					throw new Error('Incorrect char data type size: ' + col.size);
				}
				val = randomChars(col.size);
				break;
			case 'tinyint':
			case 'tiny_int':
				if (autoIncrement) {
					if (!sequences[fullTableName]) {
						val = sequences[fullTableName] = 1;
					} else {
						val = ++sequences[fullTableName];
					}
					def = mysqlUpperIntegerTypes['TINYINT UNSIGNED'];
					if (val > def.max) {
						throw new Error('Value out of bounds: ' + val);
					}
				} else {
					if (unsigned) {
						def = mysqlUpperIntegerTypes['TINYINT UNSIGNED'];
					} else {
						def = mysqlUpperIntegerTypes['TINYINT'];
					}
					val = _randomInteger(_getBounds(def, $1, $2), col.size);
				}
			case 'smallint':
			case 'small_int':
				if (col.autoIncrement) {
					if (!sequences[fullTableName]) {
						val = sequences[fullTableName] = 1;
					} else {
						val = ++sequences[fullTableName];
					}
					def = mysqlUpperIntegerTypes['SMALLINT UNSIGNED'];
					if (val > def.max) {
						throw new Error('Value out of bounds: ' + val);
					}
				} else {
					if (col.unsigned) {
						def = mysqlUpperIntegerTypes['SMALLINT UNSIGNED'];
					} else {
						def = mysqlUpperIntegerTypes['SMALLINT'];
					}
					val = _randomInteger(_getBounds(def, $1, $2), col.size);
				}
				break;
			case 'mediumint':
			case 'medium_int':
				if (col.autoIncrement) {
					if (!sequences[fullTableName]) {
						val = sequences[fullTableName] = 1;
					} else {
						val = ++sequences[fullTableName];
					}
					def = mysqlIntegerTmysqlUpperIntegerTypesypes['MEDIUMINT UNSIGNED'];
					if (val > def.max) {
						throw new Error('Value out of bounds: ' + val);
					}
				} else {
					if (col.unsigned) {
						def = mysqlUpperIntegerTypes['MEDIUMINT UNSIGNED'];
					} else {
						def = mysqlUpperIntegerTypes['MEDIUMINT'];
					}
					val = _randomInteger(_getBounds(def, $1, $2), col.size);
				}
				break;
			case 'bigint':
			case 'biginteger':
			case 'big_int':
			case 'big_integer':
				if (col.autoIncrement) {
					if (!sequences[fullTableName]) {
						val = sequences[fullTableName] = 1;
					} else {
						val = ++sequences[fullTableName];
					}
					def = mysqlUpperIntegerTypes['BIGINT UNSIGNED'];
					if (val > def.max) {
						throw new Error('Value out of bounds: ' + val);
					}
				} else {
					if (col.unsigned) {
						def = mysqlUpperIntegerTypes['BIGINT UNSIGNED'];
					} else {
						def = mysqlUpperIntegerTypes['BIGINT'];
					}
					val = _randomInteger(_getBounds(def, $1, $2), col.size);
				}
				break;
			case 'tiny_text':
				
				break;
			case 'medium_text':
				
				break;
			case 'text':
				
				break;
			case 'boolean':
				val = Math.random()*100 < 50 ? false : true;
				break;
			case 'bit':
				val = Math.random()*100 < 50 ? 0 : 1;
				break;
			case 'binary':
				
				break;
			default:
				if ((def = SERENIX_NUMBER_TYPE_INTERVALS[dtyp = dataType.toLowerCase()])) {
				
					return SERENIX_INTEGER_TYPES.indexOf(dtyp) >= 0 ?
						_randomInteger(_getBounds(def, $1, $2), size) :
						_randomFloat(_getBounds(def, $1, $2), size, precision);
					
				} else if ((def = SERENIX_STRING_TYPE_DB_NAMES[dtyp])) {
					dtyp = /([^\(\)]+)(?:\((\d+)\))?$/.exec(def);
					val = _generateStringValue(dtyp[1], typeof size !== 'number' ? dtyp[2] ? parseInt(dtyp[2], 10) : defaultStringSize : size);
				} else {
					throw new Error('Incorrect dataType: ' + dataType);
				}
		}
		return val;
	}
	function _generateStringValue(dataType, size) {
		var chars;
		var generate = stringGenerators[dataType];
		if (generate) {
			return generate(dataType, size);
		}
		//TODO: set chars variable using data type
		return randomChars(count, chars);
	}
	var dataTypeRe = /^([a-z][a-z0-9]*)(?:\([ \t]*(\d+)(?:[ \t]*,[ \t]*(\d+))?[ \t]*\))?(?:[ \t]+(unsigned))?(?:[ \t]+(auto[_-]?increment))?(?:[ \t]+(\.+))?$/i;
	
	function generateItemsFromArrayColumns(table, columns, count, dataDialect, schema) {
		var items = [];
		var i = 0;
		var c, n = columns.length;
		var item;
		var col;
		var match;
		var name;
		var tableName;
		var fullTableName;
		
		if (table instanceof String) {
			table = table.valueOf();
		}
		if (isPlainObj(table)) {
			tableName = table.name;
			if (!schema) {
				schema = table.schemaName||(isPlainObj(table.schema) ? table.schema.name : table.schema);
			}
		} else if ((typeof table === 'string') && table) {
			tableName = table;
		} else {
			throw new TypeError('Incorrect arguments');
		}
		
		fullTableName = (schema ? schema + '.' : '') + tableName;
		columns = _normalizeArrayCols(columns);
		for (; i < count; i++) {
			item = {};
			for (c=0; c < n; c++) {
				col = columns[c];
				item[col.name] = generateColValue(col, fullTableName, schema, dataDialect);
			}
			items.push(item);
		}
		return items;
	}

	function _normalizeConstraints(constraints) {
		var constraint;
		var val, min, max;
		if ((typeof (constraint = constraints.check) === 'string') && constraint) {
			constraints.check = parseCheckConstraint(constraint);
		} else if (isPlainObj(constraint)) {
			val = constraint.condition;
			if (val) {

			} else if ((min = coalesce(constraint, ['min', 'minimum', 'minValue', 'minVal', 'minimumValue', 'minimumVal'])) != undefined) {
				max = coalesce(constraint, ['max', 'maximum', 'maxValue', 'maxVal', 'maximumValue', 'maximumVal']);
				constraints.check = {type: 'check', condition: {min: min, max: max, type: 'BETWEEN', operator: 'BETWEEN'}};
			} else if (Array.isArray(consraint)) {
				constraints.check = {type: 'check', condition: {values: constraint, type: 'IN', operator: 'IN'}};
			}
		}

		if ((typeof (constraint = constraints.foreignKey||constraints.foreign||constraints.fk) === 'string') && constraint) {

		} else if (isPlainObj(constraint)) {

		}
		return constraints;
	}

	function _normalizeArrayColumn(col) {
		var match;
		if (!(match= dataTypeRe.exec(col[1]))) {
			throw new Error('Incorrect column data type');
		}
		return {
			name: col[0],
			dataType: match[1],
			unsigned: !!match[4],
			size: match[2] ? parseInt(match[2], 10) : -1,
			precision: match[3] ? parseInt(match[3], 10) : -1,
			autoIncrement: !!match[5],
			constraints: isPlainObj(col[3]) ? _normalizeConstraints(col[3]) : col[3] ? parseColumnConstraints(col[3]) : null
		};
	}
	
	function _normalizeArrayCols(columns) {
		return columns.map(function(col) {
			return _normalizeArrayColumn(col);
		});
	}
	
	
	
	function generateItemsFromObjColumns(tableName, columns, count, dataDialect, schema) {
		var items = [];
		var i = 0;
		var c, n = columns.length;
		var item;
		var col;
		var dataType;
		var size;
		var precision;
		var match;
		var name;
		var unsigned;
		var val;
		var def;
		var limit;
		var autoIncrement;
		var constraints;
		var fullTableName = (schema ? schema + '.' : '') + tableName;
		var min, max;
		columns = _normalizeObjCols(columns);
		for (; i < count; i++) {
			item = {};
			for (c=0; c < n; c++) {
				col = columns[c];				
				item[col.name] = generateColValue(col, fullTableName, schema, dataDialect);
			}
			items.push(item);
		}
		return items;
	}
	
	function generateRecordsFromArrayColumns(table, columns, count, dataDialect, schema) {
		var records = [];
		var i = 0;
		var c, n = columns.length;
		var record;
		var tableName;
		var fullTableName;
		var records;
		var x;
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		dataDialect = dataDialect||DataIO.defaulDataDialect||(DataIO.defaulDataDialect = new DataDialect());
		
		if (table instanceof String) {
			table = table.valueOf();
		}
		if (isPlainObj(table)) {
			tableName = table.name;
			if (!schema) {
				schema = table.schemaName||(isPlainObj(table.schema) ? table.schema.name : table.schema);
			}
		} else if ((typeof table === 'string') && table) {
			tableName = table;
		} else {
			throw new TypeError('Incorrect arguments');
		}
		
		fullTableName = (schema ? schema + '.' : '') + tableName;
		columns = _normalizeArrayCols(columns);
		for (; i < count; i++) {
			record = [];
			for (c=0; c < n; c++) {			
				record.push(generateColValue(columns[c], fullTableName, schema, dataDialect));
			}
			records.push(record);
		}
		return records;
	}
	
	function _normalizeObjCols(columns) {
		return columns.map(function(column, c) {
			var col = {};
			for (var name in column) {
				col[name] = column[name];
			}
			if (!(match= dataTypeRe.exec(col.dataType||col.datatype||''))) {
				throw new Error('Incorrect column data type');
			}
			col.dataType = match[1];
			if (col.unsigned == undefined)
				col.unsigned = !!match[4];
			if (col.size == undefined)
				col.size = match[2] ? parseInt(match[2], 10) : -1;
			if (col.precision == undefined)
				col.precision = match[3] ? parseInt(match[3], 10) : -1;
			if (col.autoIncrement == undefined)
				col.autoIncrement = !!match[5];
			if (typeof col.constraints == 'string')
				col.constraints =  parseColumnConstraints(col.constraints);
		});
	}
	
	
	function generateRecordsFromObjColumns(tableName, columns, count, dataDialect, schema) {
		var records = [];
		var i = 0;
		var c, n = columns.length;
		var record;
		
		var fullTableName = (schema ? schema + '.' : '') + tableName;
		
		columns = _normalizeObjCols(columns);
		for (; i < count; i++) {
			record = [];
			for (c=0; c < n; c++) {
				record.push(generateColValue(columns[c], fullTableName, schema, dataDialect));
			}
			records.push(record);
		}
		return records;
	}
	
	function generateColValue(col, fullTableName, schema, dataDialect) {
		var operator;
		var currentSeqVal;
		var colName = col.name;
		var constraints = col.constraints;
		if (constraints && !col.autoIncrement) {
			if ((constraint = constraints.foreignKey)) {
				ref = constraint.references;
				currentSeqVal = sequences[(ref.schema||schema ? (ref.schema||schema) + '.' : '') + ref.table];
				if (!currentSeqVal) {
					throw new Error('Table does not exists or empty referenced table');
				}
				return  1 + Math.floor(Math.random()*(currentSeqVal - 1));
			} else if ((constraint = constraints.check)) {
				operator = constraint.operator||constraint.condition.operator||constraint.condition.type;
				if (operator === 'BETWEEN') {
					return  _generateValueBetween(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'NOT BETWEEN') {
					return  _generateValueNotBetween(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'IN') {
					return  _generateValueIn(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'NOT IN') {
					return  _generateValueNotIn(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'LIKE') {
					return  _generateValueLike(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'NOT LIKE') {
					return  _generateValueNotLike(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'ILIKE') {
					return  _generateValueILike(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'NOT ILIKE') {
					return  _generateValueNotILike(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'RLIKE') {
					return  _generateValueRLike(col, fullTableName, constraint, dataDialect);
				} else if (operator === 'NOT RLIKE') {
					return  _generateValueNotRLike(col, fullTableName, constraint, dataDialect);
				} else {
					return  _generateValue(col, fullTableName, dataDialect);
				}
			}
		} else {
			return  _generateValue(col, fullTableName, dataDialect);
		}
	}
	
	function generateInsertFromArrayColumns(tableName, columns, count, dataDialect, schema) {
		var records;
		var x;
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		records = generateRecordsFromArrayColumns(tableName, columns, count, dataDialect||DataIO.defaulSQLDialect, schema);
		return 'INSERT INTO ' + (schema ? '`' + schema + '`.`' : '`') + tableName 
			+ '`\nVALUES\n\t(' + records.map(function(record) {
				return record.reduce(function(accumulator, val, j) {
						return accumulator + (j ? ', ' : '') + val;
				}, '');
			}).join('),\n\t(') + ');';
	}

	function generateCSVDataFromArrayColumns(tableName, columns, count, dataDialect, schema) {
		var records;
		var x;
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		if (!dataDialect) {
			dataDialect = DataIO.defaulCSVDialect||(new CSVDialect());
		} else if (!(dataDialect instanceof CSVDialect)) {
			throw new TypeError('Incorrect data dialect: CSVDataDialect expected');
		}
		records = generateRecordsFromArrayColumns(tableName, columns, count, dataDialect, schema);
		var delim = dataDialect.delim;
		return records.map(function(record) {
				return record.join(delim);
			}).join('\n');
	}

	function generateECSVDataFromArrayColumns(table, columns, opts, dataDialect, schema) {
		var x;
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		if (!dataDialect) {
			dataDialect = DataIO.defaulCSVDialect||(new CSVDialect());
		} else if (!(dataDialect instanceof CSVDialect)) {
			throw new TypeError('Incorrect data dialect: CSVDataDialect expected');
		}
		
		var result = generateERecordsFromArrayColumns(table, columns, opts, dataDialect, schema||opts.schema);
		var delim = dataDialect.delim;
		return (dataDialect.withBOM ? CSVDialect.EXCEL_BOM : '') + generateCSVHeaders(result.columns, dataDialect) + result.rows.map(function(record) {
			return record.join(delim);
		}).join('\n') + (dataDialect.shouldLastRecordHasLineBreak ? '\n' : '');
	}

	function generateCSVHeaders(columns, dialect) {
		var delim = dialect.delim;
		if (dialect.shouldWriteHeaders) {
			return columns.map(function(col, i) {
				return col.title||col.label||col.caption||col.name||('Col' + (i + 1));
			}).join(delim) + '\n';
		}
		return '';
	}

	function generateEInsertFromArrayColumns(table, columns, opts, sqlDialect, schema) {
		var openQuote = ((function() { 
			var x;
			if (sqlDialect instanceof String) {
				sqlDialect = sqlDialect.valueOf();
			}
			if (schema instanceof String) {
				schema = schema.valueOf();
			}
			if (typeof sqlDialect === 'string') {
				x = sqlDialect;
				sqlDialect = schema;
				schema = x;
			}
			return sqlDialect;
		})()||(sqlDialect = new SQLDialect())).openQuote||'`';
		var closeQuote = sqlDialect.closerQuote||'`';
		var result = generateERecordsFromArrayColumns(table, columns, opts, sqlDialect, schema||opts.schema);
		var colsString= '';
		if (result.columnNames.length < columns.length) {
			colsString = '\n(' + result.columnNames.join(', ') + ')';
		}
		return 'INSERT INTO ' + (result.schema ? openQuote + result.schema + closeQuote + '.' + openQuote : openQuote) 
			+ result.tableName + closeQuote
			+ colsString
			+ '\nVALUES\n\t(' + result.rows.map(function(record) {
				return record.reduce(function(accumulator, val, j) {
						return accumulator + (j ? ', ' : '') + val;
				}, '');
			}).join('),\n\t(') + ');';
	}
	
	function generateInsertFromObjColumns(table, columns, count, dataDialect, schema) {
		var tableName;
		var records;
		var x;
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		
		
		if (table instanceof String) {
			table = table.valueOf();
		}
		
		if (isPlainObj(table)) {
			tableName = table.tableName||table.name;
			if (!schema) {
				schema = table.schema;
			}
		} else if (typeof table === 'string') {
			tableName = table;
		}
		
		records = generateRecordsFromObjColumns(tableName, columns, count, dataDialect||DataIO.defaulSQLDialect, schema);
		return 'INSERT INTO ' + (schema ? '`' + schema + '`.`' : '`') + tableName 
			+ '`\nVALUES\n\t(' + records.map(function(record) {
				return record.reduce(function(accumulator, val, j) {
						return accumulator + (j ? ', ' : '') + val;
				}, '');
			}).join('),\n\t(') + ');';
	}

	function generateERecordsFromArrayColumns(table, columns, opts, dataDialect, schema) {
		var rows = [];
		var row;
		var c, r, n, count;
		var columnNames = [];
		var col;
		var fullTableName;
		var cols;
		var randomCols = [];
		var enums;
		var enumNames;
		function processEnums(enumNames, enums, columnNames) {
			var i = 0;
			var name = enumNames[i];
			var enumValues = enums[name];
			var c = columnNames.indexOf(name);
			var j, len;
			var i = 0, 
				enumsCount = enumNames.length;
			var count = 1;
			for (i = 1; i < enumsCount; i++) {
				count *= enums[enumNames[i]].length;
			}
			for (j = 0, len = enumValues.length; j < len; j++) {
				offset = count*j;
				val = dataDialect.convert(enumValues[j], cols[c]);
				for (r = offset, n = offset + count; r < n; r++) {
					row = [];
					row[c] = val;
					rows.push(row);
				}
				if (enumsCount > 1)
					_processEnums(enumNames, enums, 1, enumsCount, columnNames, rows, offset);
			}
		}
		
		function _processEnums(enumNames, enums, i, enumsCount, columnNames, rows, offset) {
			var name = enumNames[i];
			var enumValues = enums[name];
			var c = columnNames.indexOf(name);
			var r = offset;
			var amplitude = rows.length - offset;
			var j = 0, len = enumValues.length;
			var b, batch = amplitude/len;
			for (j = 0; j < len; j++) {
				val = dataDialect.convert(enumValues[j], cols[c]);
				for (b = 0; b < batch; b++) {
					rows[r++][c] = val;
				}
			}
			if (enumsCount > i + 1) {
				_processEnums(enumNames, enums, i + 1, enumsCount, columnNames, rows, offset);
			}
		}
		var enums = opts.enums||opts.listOfValues||opts.values||{};
		var tableName;
		var x;
		if (dataDialect instanceof String) {
			dataDialect = dataDialect.valueOf();
		}
		if (schema instanceof String) {
			schema = schema.valueOf();
		}
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			schema = x;
		}
		if (table instanceof String) {
			table = table.valueOf();
		}
		if (isPlainObj(table)) {
			tableName = table.name;
			if (!schema) {
				schema = table.schemaName||(isPlainObj(table.schema) ? table.schema.name : table.schema);
			}
		} else if ((typeof table === 'string') && table) {
			tableName = table;
		} else {
			throw new TypeError('Incorrect arguments');
		}

		var fullTableName = (schema ? schema + '.' : '') + tableName;

		var x;
		if (dataDialect instanceof String) {
			dataDialect = dataDialect.valueOf();
		}
		if (schema instanceof String) {
			schema = schema.valueOf();
		}
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			dataDialect = x;
		}
		var cols;
		var enumNames = opts.enumNames||opts.enumKeys||Object.keys(enums);

		if (!dataDialect) {
			dataDialect = new DataDialect();
		}
		if (opts.ignoreAutoIncrement) {
			cols = [];
			columns.forEach(function(col) {
				var colDef = _normalizeArrayColumn(col);
				if (!colDef.autoIncrement) {
					cols.push(colDef);
					columnNames.push(col[0]);
					if (enumNames.indexOf(col[0]) < 0) {
						randomCols.push(colDef);
					}
				}
			});
		} else {
			cols = columns.map(function(col) {
				var colDef = _normalizeArrayColumn(col);
				columnNames.push(col[0]);
				if (enumNames.indexOf(col[0]) < 0) {
					randomCols.push(colDef);
				}
				return colDef;
			});
		}
		
		processEnums(enumNames, enums, columnNames);
		count = randomCols.length;
		for (r = 0, n = rows.length; r < n; r++) {
			row = rows[r];
			for (c = 0; c < count; c++) {
				col = randomCols[c];
				row[columnNames.indexOf(col.name)] = generateColValue(col, fullTableName, schema, dataDialect);
			}
		}
		return {columns: cols, rows: rows, columnNames: columnNames, tableName: tableName, schema: schema||''};
	}

	function generateDataERecordsFromArrayColumns(table, columns, opts, schema, dataDialect) {
		var rows = [];
		var row;
		var c, r, n, count;
		var columnNames = [];
		var col;
		var fullTableName;
		var cols;
		var randomCols = [];
		var enums;
		var enumNames;
		
		function processEnums(enumNames, enums, columnNames) {
			var enumValues = enums[i];
			var name = enumNames[i];
			var c = columnNames.indexOf(name);
			var j, len;
			var i = 0, 
				enumsCount = enumNames.length;
			var count = 1;
			for (i = 1; i < enumsCount; i++) {
				count *= enums[i].length;
			}
			for (j = 0, len = enumValues.length; j < len; j++) {
				batch.splice(0, batch.length);
				offset = count*j;
				val = enumValues[j];
				for (r = offset, n = offset + count; r < n; r++) {
					row = [];
					row[c] = val;
					rows.push(row);
				}
				if (enumsCount > 1)
					_processEnums(enumNames, enums, 1, enumsCount, columnNames, rows, offset);
			}
		}
		
		function _processEnums(enumNames, enums, i, enumsCount, columnNames, rows, offset) {
			var enumValues = enums[i];
			var name = enumNames[i];
			var c = columnNames.indexOf(name);
			var row;
			var r = offset;
			var amplitude = rows.length - offset;
			var j = 0, len = enumValues.length;
			var b, batch = amplitude/len;
			for (j = 0; j < len; j++) {
				val = enumValues[j];
				for (b = 0; b < batch; b++) {
					row[r++][c] = val;
				}
			}
			if (enumsCount > i + 1) {
				_processEnums(enumNames, enums, i + 1, enumsCount, columnNames, rows, offset);
			}
		}
		if (!dataDialect) {
			dataDialect = new DataDialect();
		} else if (!(dataDialect instanceof DataDialect)) {
			throw new TypeError('Incorrect data dialect');
		}
		var enums = opts.enums||opts.listOfValues||opts.values||{};
		if (table instanceof String) {
			table = table.valueOf();
		}
		if (isPlainObj(table)) {
			tableName = table.name;
			if (!schema) {
				schema = table.schemaName||(isPlainObj(table.schema) ? table.schema.name : table.schema);
			}
		} else if ((typeof table === 'string') && table) {
			tableName = table;
		} else {
			throw new TypeError('Incorrect arguments');
		}

		var x;
		if (dataDialect instanceof String) {
			dataDialect = dataDialect.valueOf();
		}
		if (schema instanceof String) {
			schema = schema.valueOf();
		}
		if (typeof dataDialect === 'string') {
			x = dataDialect;
			dataDialect = schema;
			dataDialect = x;
		}
		var cols;
		var enumNames = opts.enumNames||opts.enumKeys||Object.keys(enums);
		if (opts.ignoreAutoIncrement) {
			cols = [];
			columns.forEach(function(col) {
				var colDef = _normalizeArrayColumn(col);
				if (!colDef.autoIncrement) {
					cols.push(colDef);
					columnNames.push(col[0]);
					if (enumNames.indexOf(col[0]) < 0) {
						randomCols.push(colDef);
					}
				}
			});
		} else {
			cols = columns.map(function(col) {
				var colDef = _normalizeArrayColumn(col);
				columnNames.push(col[0]);
				if (enumNames.indexOf(col[0]) < 0) {
					randomCols.push(colDef);
				}
				return colDef;
			});
		}
		
		processEnums(enumNames, enums, columnNames);
		count = randomCols.length;
		for (r = 0, n = rows.length; r < n; r++) {
			row = rows[r];
			for (c = 0; c < count; c++) {
				row[columnNames.indexOf(col.name)] = generateColValue(randomCols[c], fullTableName, schema, dataDialect);
			}
		}
		return {columns: cols, rows: rows};
	}

	function _getDialetKey(dialect) {
		var k;
		if ((k = dialect.key||dialect.name)) {
			return k;
		}
		k = dialect.__CLASS_NAME__;
		if (!k)
			return;
		if (k.endsWith('Dialect')) {
			return k.substring(k.length - 7);
		}
	}
	/**
	 * 
	 * @param {ADataDialect|Object|Array|string} $ 
	 */
	function DataIO($) {
		var x;
		var k, v;
		var dialects = this.__dialects_ = {};
		if ($ instanceof String) {
			$ = $.valueOf();
		}
		if ($ instanceof ADataDialect) {
			k = _getDialetKey($);
			if (k)
				dialects[k] = dialects[k.toLowerCase()] = dialects[k.toUpperCase()] = $;
		} else if (isPlainObj($)) {
			if (isPlainObj(x = $.dialects)) {
				for (k in x) {
					v = x[k];
					if (v instanceof String) {
						v = v.valueOf();
					}
					if (v instanceof ADataDialect) {
						dialects[k] = v;
					} else if (isPlainObj(v)) {
						dialects[k] = v = ADataDialect.createInstance(v);
					} else if ((typeof x === 'string') && v) {
						dialects[k] = v = ADataDialect.createInstance(v);
					}
				}
			} else if (Array.isArray(x)) {
				x.forEach(function(dialect) {
					if (dialect instanceof ADataDialect) {
						//nothing todo
					} else if (isPlainObj(dialect)) {
						dialect = ADataDialect.createInstance(dialect);
					} else if ((typeof x === 'string') && dialect) {
						dialect = ADataDialect.createInstance(dialect);
					} else {
						return;
					}
					k = _getDialetKey(dialect);
					if (k)
						dialects[k] = dialects[k.toLowerCase()] = dialects[k.toUpperCase()] = dialect;
				});
			}
		} else if ((typeof $ === 'string') && $) {
			v = ADataDialect.createInstance(dialect);
			k = _getDialetKey(dialect);
			if (k)
				dialects[k] = dialects[k.toLowerCase()] = dialects[k.toUpperCase()] = dialect;
		}
	}

	DataIO.__CLASS__ = DataIO.prototype.__CLASS__ = DataIO;

	DataIO.__CLASS_NAME__ = DataIO.prototype.__CLASS_NAME__ = 'DataIO';
	
	DataIO.generateInsertFromArrayColumns = generateInsertFromArrayColumns;
	
	DataIO.generateInsertFromObjColumns = generateInsertFromObjColumns;
	
	DataIO.generateRecordsFromArrayColumns = generateRecordsFromArrayColumns;
	
	DataIO.generateRowsFromArrayColumns = generateRecordsFromArrayColumns;
	
	
	DataIO.generateRecordsFromObjColumns = generateRecordsFromObjColumns;
	
	DataIO.generateRowsFromObjColumns = generateRecordsFromObjColumns;
	
	
	
	DataIO.generateItemsFromArrayColumns = generateItemsFromArrayColumns;
	
	DataIO.generateItemsFromObjColumns = generateItemsFromObjColumns;

	DataIO.generateERecordsFromArrayColumns = generateERecordsFromArrayColumns;

	DataIO.generateEInsertFromArrayColumns = generateEInsertFromArrayColumns;

	DataIO.generateDataERecordsFromArrayColumns = generateDataERecordsFromArrayColumns;

	DataIO.insertFromArrayColumns = generateInsertFromArrayColumns;
	
	DataIO.insertFromObjColumns = generateInsertFromObjColumns;
	
	DataIO.recordsFromArrayColumns = generateRecordsFromArrayColumns;
	
	DataIO.rowsFromArrayColumns = generateRecordsFromArrayColumns;
	
	
	DataIO.recordsFromObjColumns = generateRecordsFromObjColumns;
	
	DataIO.rowsFromObjColumns = generateRecordsFromObjColumns;
	
	
	
	DataIO.itemsFromArrayColumns = generateItemsFromArrayColumns;
	
	DataIO.itemsFromObjColumns = generateItemsFromObjColumns;

	DataIO.eRecordsFromArrayColumns = generateERecordsFromArrayColumns;

	DataIO.eInsertFromArrayColumns = generateEInsertFromArrayColumns;

	DataIO.eDataRecordsFromArrayColumns = generateDataERecordsFromArrayColumns;
	
	DataIO.edataRecordsFromArrayColumns = generateDataERecordsFromArrayColumns;



	DataIO.generateCSVDataFromArrayColumns = generateCSVDataFromArrayColumns;

	DataIO.csvFromArrayColumns = generateCSVDataFromArrayColumns;

	DataIO.generateECSVDataFromArrayColumns = generateECSVDataFromArrayColumns;

	DataIO.ecsvFromArrayColumns = generateECSVDataFromArrayColumns;


	/**
	 * 
	 * @param {string|Array<string>} dataType 
	 * @param {function} generate 
	 */
	DataIO.registerStringGenerator = function(dataType, generate) {
		if (typeof generate !== 'function') {
			throw new Error('Incorrect arguments');
		}
		dataType.split(/\s*\|\s*/).forEach(function(dt) {
			stringGenerators[dt] = generate;
		});
	};
	
	DataIO.unregisterStringGenerator = function(dataType) {
		dataType.split(/\s*\|\s*/).forEach(function(dt) {
			delete stringGenerators[dt];
		});
	};
	if (!DataIO.defaulSQLDialect && (typeof SQLDialect === 'function')) {
		DataIO.defaulSQLDialect = new SQLDialect();	
	}

	if (typeof SQLDialect === 'function') {
		SQLDialect.BUILTIN_MAIN_INTEGER_TYPES = SERENIX_MAIN_INTEGER_TYPES;

		SQLDialect.BUILTIN_INTEGER_TYPES = SERENIX_INTEGER_TYPES;

		SQLDialect.BUILTIN_STRING_TYPE_NAMES = SERENIX_STRING_TYPE_NAMES;

		SQLDialect.BUILTIN_NUMBER_TYPES_MAP = SERENIX_NUMBER_TYPES_MAP;

		SQLDialect.MYSQL_INTEGER_TYPES = mysqlIntegerTypes;

		SQLDialect.MYSQL_UPPER_INTEGER_TYPES = mysqlUpperIntegerTypes;

		SQLDialect.BUILTIN_NUMBER_TYPE_INTERVALS = SERENIX_NUMBER_TYPE_INTERVALS;


		ADataDialect.BUILTIN_MAIN_INTEGER_TYPES = SERENIX_MAIN_INTEGER_TYPES;

		ADataDialect.BUILTIN_INTEGER_TYPES = SERENIX_INTEGER_TYPES;

		ADataDialect.BUILTIN_STRING_TYPE_NAMES = SERENIX_STRING_TYPE_NAMES;

		ADataDialect.BUILTIN_NUMBER_TYPES = SERENIX_NUMBER_TYPES;

		ADataDialect.MYSQL_INTEGER_TYPES = mysqlIntegerTypes;
		
		ADataDialect.MYSQL_UPPER_INTEGER_TYPES = mysqlUpperIntegerTypes;

		ADataDialect.BUILTIN_NUMBER_TYPE_INTERVALS = SERENIX_NUMBER_TYPE_INTERVALS;
	}
	
	if (!DataIO.defaulDataDialect && (typeof DataDialect === 'function')) {
		DataIO.defaulDataDialect = new DataDialect();
	}

	DataIO.BUILTIN_MAIN_INTEGER_TYPES = SERENIX_MAIN_INTEGER_TYPES;

	DataIO.BUILTIN_INTEGER_TYPES = SERENIX_INTEGER_TYPES;

	DataIO.BUILTIN_STRING_TYPE_NAMES = SERENIX_STRING_TYPE_NAMES;

	DataIO.BUILTIN_NUMBER_TYPES = SERENIX_NUMBER_TYPES;

	DataIO.BUILTIN_NUMBER_TYPE_INTERVALS = SERENIX_NUMBER_TYPE_INTERVALS;

	DataIO.MYSQL_INTEGER_TYPES = mysqlIntegerTypes;

	DataIO.MYSQL_UPPER_INTEGER_TYPES = mysqlUpperIntegerTypes;

	DataIO.SERENIX_NUMBER_TYPE_INTERVALS = SERENIX_NUMBER_TYPE_INTERVALS;

	
	return DataIO;
	
});

;(function(root, name, factory) {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([name], factory);
    } else {
        root[name] = factory();
    }    
})(this, 'DataGenerator', function() {

	function DataGenerator($) {
		DataIO.apply(this, arguments);
	}

	;(function() {
		var key;
		for (key in DataIO) {
			DataGenerator[key] = DataIO[key];
		}
	})();

	DataGenerator.prototype = new DataIO();

	DataGenerator.__CLASS__ = DataGenerator.prototype.__CLASS__ = DataGenerator;

	DataGenerator.__CLASS_NAME__ = DataGenerator.prototype.__CLASS_NAME__ = 'DataGenerator';

	DataGenerator.__SUPER__ = DataGenerator.__SUPER_CLASS__ = DataIO;


	if (typeof SereniX.data.addChild === 'function') {
		SereniX.data.addChild(DataGenerator);
	} else {
		SereniX.data.DataGenerator = DataGenerator;
	}


	return DataGenerator;

});
