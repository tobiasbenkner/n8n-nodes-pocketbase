import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class PocketbaseApi implements ICredentialType {
	name = 'pocketbaseApi';
	displayName = 'Pocketbase API';
	documentationUrl = 'https://github.com/tobiasbenkner/n8n-nodes-pocketbase/';
	properties: INodeProperties[] = [
		{
			displayName: 'Your Pocketbase Url',
			name: 'url',
			type: 'string',
			typeOptions: { password: false },
			default: '',
			placeholder: 'https://pb.example.com',
			required: true,
		},
		{
			displayName: 'User collection name',
			description: 'The name of the collection that contains the user',
			name: 'user_collection',
			type: 'string',
			default: '_superusers',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			typeOptions: { password: false },
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.url}}',
			url: '=/api/collections/{{$credentials?.user_collection}}/auth-with-password',
			method: 'POST',
			body: {
				identity: '={{$credentials?.username}}',
				password: '={{$credentials?.password}}',
			},
		},
	};
}
