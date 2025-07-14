import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeExecutionWithMetadata,
	NodeOperationError,
} from 'n8n-workflow';
import PB from 'pocketbase';
import { Credentials } from '../../credentials/types';
import FormData from 'form-data';
import { Buffer } from 'buffer';
import axios from 'axios';

export class Pocketbase implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pocketbase Append Image',
		name: 'pocketbase',
		icon: 'file:pocketbase.svg',
		group: ['transform'],
		version: 1,
		subtitle: 'Append image to Pocketbase',
		// subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Get data from Pocketbase',
		defaults: {
			name: 'Pocketbase',
		},
		credentials: [
			{
				name: 'pocketbaseApi',
				required: true,
			},
		],

		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Collection',
				name: 'collection',
				type: 'string',
				default: '',
				required: true,
				description: 'The collection you are working on',
			},
			{
				displayName: 'Column',
				name: 'column',
				type: 'string',
				default: '',
				required: true,
				description: 'The column of your collection',
			},
			{
				displayName: 'Row ID',
				name: 'row_id',
				type: 'string',
				default: '',
				required: true,
				description: 'The row you like to update',
			},
			{
				displayName: 'Image in Base64',
				name: 'image',
				type: 'string',
				default: '',
				required: true,
				description: 'The image that you want to upload',
			},
		],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
		const returnData: IDataObject[] = [];
		const auth = (await this.getCredentials('pocketbaseApi')) as unknown as Credentials;

		const pb = new PB(auth.url);
		await pb.collection(auth.user_collection).authWithPassword(auth.username, auth.password);
		if (!pb.authStore.isValid) {
			throw new NodeOperationError(this.getNode(), `Authentication failed!`);
		}

		const items = this.getInputData();
		for (let i = 0; i < items.length; i++) {
			const collection = this.getNodeParameter('collection', i) as string;
			const column = this.getNodeParameter('column', i) as string;
			const row_id = this.getNodeParameter('row_id', i) as string;
			const base64 = this.getNodeParameter('image', i) as string;
			const buffer = Buffer.from(base64, 'base64');
			const formData = new FormData();

			const foundRow = await pb.collection(collection).getOne(row_id);
			const found = foundRow[column];

			if (Array.isArray(found)) {
				found.forEach((image) => formData.append(column, image));
			}

			formData.append(column, buffer, {
				filename: `${generateRandomName()}.png`,
				contentType: 'image/png',
			});

			const response = await axios.patch(
				`${auth.url}/api/collections/${collection}/records/${row_id}`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${pb.authStore.token}`,
					},
				},
			);

			const record = response.data;
			const image_url = `${auth.url}/api/files/${collection}/${record.id}/${record[column]}`;
			returnData.push({
				image_url: image_url,
			});
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

function generateRandomName() {
	return Math.random().toString(36).substring(2, 8);
}
