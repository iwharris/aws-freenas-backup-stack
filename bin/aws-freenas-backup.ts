#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { AwsFreenasBackupStack } from '../lib/aws-freenas-backup-stack';

const app = new App();
new AwsFreenasBackupStack(app, 'AwsFreenasBackupStack');
