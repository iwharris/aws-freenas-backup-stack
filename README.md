# Personal freenas backup in AWS

## Usage

To deploy the stack:

```bash
npm install
npm run build
npm deploy
```

The `accessKeyId` and `secretAccessKey` will be shown in the output; enter those into FreeNAS.

To preview the CloudFormation changeset:

```bash
npm run synth
```
