import bcrypt from "bcrypt";

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

export function encryptpassword(password: string) {
  return bcrypt.hashSync(password, salt);
}

export async function comparePassword({
  dbPassword,
  userPassword,
}: {
  dbPassword: string;
  userPassword: string;
}) {
  const isMatch = await bcrypt.compare(userPassword, dbPassword);
  return isMatch;
}
