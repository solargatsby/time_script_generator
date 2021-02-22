# time_script_generator

Generator of [time_index_state_type_script](https://github.com/solargatsby/time_index_state_type_script) and [time_info_type_script](https://github.com/solargatsby/time_info_type_script)

### How to Work

```shell
git clone https://github.com/solargatsby/time_script_generator.git
cd time_script_generator
mv .env.example .env
```

- Edit .env file

You need to copy `.env` file from `.env.example` and input your owner private key, ckb node url and ckb indexer url.
Note that if you want to create time info cell, do not inout time script args, program will input it after crate the first time info cell,
if you want to update the time info cell, please input time script args correctly.

- Installation

```shell
yarn install   # install dependency libraries
```

- Running

```shell
yarn start
```

> Note: Every transaction needs time to wait to join the blockchain.
