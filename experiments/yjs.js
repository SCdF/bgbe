import * as Y from "yjs";

// Yjs documents are collections of
// shared objects that sync automatically.
const ydoc = new Y.Doc();
// Define a shared Y.Map instance
const ymap = ydoc.getMap();
ymap.observeDeep((events) => {
  for (const ymapEvent of events) {
    ymapEvent.target === ymap; // => true

    // Find out what changed:
    // Option 1: A set of keys that changed
    ymapEvent.keysChanged; // => Set<strings>
    // Option 2: Compute the differences
    ymapEvent.changes.keys; // => Map<string, { action: 'add'|'update'|'delete', oldValue: any}>

    // sample code.
    ymapEvent.changes.keys.forEach((change, key) => {
      if (change.action === "add") {
        console.log(
          `Property "${key}" was added. Initial value: "${ymap.get(key)}".`
        );
      } else if (change.action === "update") {
        console.log(
          `Property "${key}" was updated. New value: "${ymap.get(
            key
          )}". Previous value: "${change.oldValue}".`
        );
      } else if (change.action === "delete") {
        console.log(
          `Property "${key}" was deleted. New value: undefined. Previous value: "${change.oldValue}".`
        );
      }
    });
  }
});

ymap.set("keyA", "valueA");
const foo = {};
ymap.set("keyB", foo);
foo.bar = "smang";
ymap.get("keyB").bar = "smang2";
