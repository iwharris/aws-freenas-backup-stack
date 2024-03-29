import { App, RemovalPolicy, Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { aws_s3 as s3, aws_iam as iam } from 'aws-cdk-lib';

export class AwsFreenasBackupStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucketName = this.node.tryGetContext('bucket_name');

        const bucket = new s3.Bucket(this, 'FreenasS3BackupBucket', {
            bucketName,
            // KMS_MANAGED is preferable but won't work when backing up small files
            // See https://github.com/rclone/rclone/issues/1824 for details
            encryption: s3.BucketEncryption.S3_MANAGED,

            // Allow authenticated access only
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

            // Enable bucket-level versioning
            versioned: true,

            // Transition files to cheaper storage after a certain interval
            lifecycleRules: [
                {
                    id: 'default',
                    enabled: true,
                    abortIncompleteMultipartUploadAfter: Duration.days(7),
                    transitions: [
                        {
                            transitionAfter: Duration.days(1),
                            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                        },
                    ],
                    noncurrentVersionExpiration: Duration.days(1),
                },
                {
                    id: 'lightroom-transition-glacier',
                    enabled: true,
                    prefix: 'lightroom',
                    transitions: [
                        {
                            transitionAfter: Duration.days(7),
                            storageClass: s3.StorageClass.GLACIER, // retrieval between 1 minute and 12 hours
                        },
                        {
                            transitionAfter: Duration.days(100),
                            storageClass: s3.StorageClass.DEEP_ARCHIVE, // retrieval within 12 hours
                        },
                    ],
                },
                {
                    id: 'backup-transition-glacier',
                    enabled: true,
                    prefix: 'backup',
                    transitions: [
                        {
                            transitionAfter: Duration.days(7),
                            storageClass: s3.StorageClass.GLACIER, // retrieval between 1 minute and 12 hours
                        },
                        {
                            transitionAfter: Duration.days(100),
                            storageClass: s3.StorageClass.DEEP_ARCHIVE, // retrieval within 12 hours
                        },
                    ],
                },
                {
                    id: 'scans-transition-glacier',
                    enabled: true,
                    prefix: 'scans',
                    transitions: [
                        {
                            transitionAfter: Duration.days(1),
                            storageClass: s3.StorageClass.GLACIER, // retrieval between 1 minute and 12 hours
                        },
                        {
                            transitionAfter: Duration.days(100),
                            storageClass: s3.StorageClass.DEEP_ARCHIVE, // retrieval within 12 hours
                        },
                    ],
                    noncurrentVersionExpiration: Duration.days(7),
                },
            ],
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const group = new iam.Group(this, 'FreenasS3BackupGroup', {
            groupName: 'FreenasS3BackupGroup',
        });

        const user = new iam.User(this, 'FreenasBackupUser', {
            groups: [group],
        });

        // Customer managed policy links the user to the S3 access permission
        // Minimal permissions taken from https://rclone.org/s3/
        new iam.ManagedPolicy(this, 'FreenasS3BackupManagedPolicy', {
            managedPolicyName: 'FreenasS3BackupManagedPolicy',
            groups: [group],
            statements: [
                // Allow enumerating all buckets in account
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:ListAllMyBuckets'],
                    resources: ['arn:aws:s3:::*'],
                }),

                // Allow some bucket-level actions
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:ListBucket', 's3:GetBucketLocation'],
                    resources: [bucket.bucketArn],
                }),

                // Allow object-level get/put/delete
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
                    resources: [`${bucket.bucketArn}/*`],
                }),
            ],
        });

        const accessKey = new iam.CfnAccessKey(this, 'FreenasBackupUserAccessKey', {
            userName: user.userName,
        });

        new CfnOutput(this, 'accessKeyId', {
            value: accessKey.ref,
            description: 'Access key ID for the backup user',
        });
        new CfnOutput(this, 'secretAccessKey', {
            value: accessKey.attrSecretAccessKey,
            description: 'Secret access key for the backup user',
        });
    }
}
