import { Token } from './token';
import { ErrorLine } from './types';

type Value = string | Token | ParsedToken;

type Base = {
	type: string;
	ctx?: {
		lineContent: string;
		line: number;
	};
};

export type FunctionCallToken = Base & {
	name: Token;
	params: ParsedToken[];
	isAwait: Boolean;
};

export type RegexToken = Base & {
	value: Value;
	flags: string;
};

export type ObjectPropertyReadToken = Base & {
	name: Token | string;
};

export type VariablesType = {
	name: Token | string;
	value: Value;
};

export type VariableAssignment = Base & {
	name: Token | string;
	value: Value;
	operator?: Token;
};

export type VariableToken = Base & {
	name?: Token | string;
	value?: Value;
	variables?: Array<VariablesType>;
};

export type TypeToken = Base & {
	value: Value;
};

export type LoopToken = Base & {
	body: Array<ParsedToken>;
	condition?: ParsedToken;
};

export type FunctionArg = Base & {
	name: Token;
	default: Token | string | ParsedToken;
};

export type ObjectProperty = Base & {
	name: Token;
	value: ParsedToken;
};

export type FunctionToken = Base & {
	name: Token;
	args: FunctionArg[];
	body: ParsedToken[];
	isAsync: Boolean;
};

export type DefaultToken = Base & {
	name: Token | string;
	value: Token | string | ParsedToken;
};

export type ObjectToken = Base & {
	properties: Array<ObjectProperty>;
};

export type BinaryExpressionToken = Base & {
	left: ParsedToken | Token;
	right: ParsedToken | Token;
	operator: Token;
};

export type ArrayToken = Base & {
	values: ParsedToken[];
};

export type ParsedToken =
	| TypeToken
	| FunctionToken
	| FunctionArg
	| ObjectToken
	| ArrayToken
	| RegexToken
	| BinaryExpressionToken
	| ObjectPropertyReadToken
	| VariableToken
	| FunctionCallToken
	| VariableAssignment
	| DefaultToken;
