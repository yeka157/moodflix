import { lookup } from "node:dns";
import { Agent } from "node:https";
import { BlockList, isIP } from "node:net";

const prohibited = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
] as const) {
  prohibited.addSubnet(address, prefix, "ipv4");
}
prohibited.addSubnet("2001::", 23, "ipv6");
prohibited.addSubnet("2001:db8::", 32, "ipv6");
prohibited.addSubnet("2002::", 16, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");

export function isPublicPushAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return !prohibited.check(address, "ipv4");
  }
  if (family === 6) {
    return (
      globalV6.check(address, "ipv6") && !prohibited.check(address, "ipv6")
    );
  }
  return false;
}

// Check the addresses used by the actual socket lookup, avoiding a separate
// validation lookup followed by a second, potentially different DNS answer.
export function createPushAgent() {
  return new Agent({
    lookup(hostname, options, callback) {
      lookup(
        hostname,
        { all: true, family: options.family },
        (error, addresses) => {
          if (error) {
            callback(error, "", 4);
            return;
          }
          if (
            !addresses.length ||
            addresses.some(({ address }) => !isPublicPushAddress(address))
          ) {
            callback(new Error("Push destination is not public"), "", 4);
            return;
          }
          if (options.all) {
            callback(null, addresses);
          } else {
            callback(null, addresses[0].address, addresses[0].family);
          }
        }
      );
    },
  });
}
