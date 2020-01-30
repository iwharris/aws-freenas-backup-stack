# Personal freenas backup in AWS

## Usage

To deploy the stack:

```bash
npm install
npm run deploy

# Optionally, override the default bucket name:
npm run deploy -c bucket_name=my-bucket-name
```

The `accessKeyId` and `secretAccessKey` will be shown in the output; enter those into FreeNAS.

To preview the CloudFormation changeset:

```bash
npm run synth
```

To see the diff with the currently-deployed stack:

```bash
npm run diff
```
