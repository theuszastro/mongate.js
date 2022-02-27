import { Token } from './token';

type Value = string | Token | ParsedToken;

export type FunctionCallToken = {
	type: string;
	name: Value;
	params: ParsedToken[];
	isAwait: Boolean;
};

export type RegexToken = {
	type: string;
	value: Value;
	flags: string;
};

export type ObjectPropertyReadToken = {
	type: string;
	name: Value;
};

export type VariablesType = {
	name: Token | string;
	value: Value;
};

export type VariableAssignment = {
	type: string;
	name: Token | string;
	value: Value;
	operator?: Token;
};

export type VariableToken = {
	type: string;
	name?: Token | string;
	value?: Value;
	variables?: Array<VariablesType>;
};

export type TypeToken = {
	type: string;
	value: Value;
};

export type LoopToken = {
	type: string;
	body: Array<ParsedToken>;
	condition?: ParsedToken;
};

export type FunctionArg = {
	type: string;
	name: Value;
	default: Token | string;
};

export type FunctionToken = {
	type: string;
	name: Value;
	args: FunctionArg[];
	body: ParsedToken[];
	isAsync: Boolean;
};

export type DefaultToken = {
	type: string;
	name: Token | string;
	value: Token | string | ParsedToken;
};

export type ObjectToken = {
	type: string;
	properties: Array<Token | ParsedToken>;
};

export type BinaryExpressionToken = {
	type: string;
	left: Token;
	right: Token;
	operator: Token;
};

export type ArrayToken = {
	type: string;
	values: ParsedToken[];
};

export type ParsedToken =
	| TypeToken
	| FunctionToken
	| FunctionArg
	| ObjectToken
	| BinaryExpressionToken
	| ArrayToken
	| ObjectPropertyReadToken
	| DefaultToken;
