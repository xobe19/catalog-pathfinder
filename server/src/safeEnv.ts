export default function processEnvSafe(envName: any) {
  if (!process.env[envName])
    throw new Error(`Please set the ${envName} environment variable.`);
  return process.env[envName];
}
