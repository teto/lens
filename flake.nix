{
  description = "A very basic flake";
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/release-21.05";
  };

  outputs = { self, nixpkgs, flake-utils }: 
  flake-utils.lib.eachDefaultSystem (system: let 
    pkgs = nixpkgs.legacyPackages.x86_64-linux.pkgs;
  in {

    packages.lens = pkgs.mkYarnPackage {
      NIX_DEBUG = 8;
      name = "lens";
      src = ./.;
      packageJSON = ./package.json;
      yarnLock = ./yarn.lock;
      yarnNix = ./yarn.nix;

      # yarnPreBuild = ''
      #   # workaround for missing opencollective-postinstall
      #   mkdir -p $TMPDIR/bin
      #   touch $TMPDIR/bin/opencollective-postinstall
      #   chmod +x $TMPDIR/bin/opencollective-postinstall
      #   export PATH=$PATH:$TMPDIR/bin

      #   export ELECTRON_SKIP_BINARY_DOWNLOAD=1
      # '';

      # buildPhase = ''
      #   yarn build --offline
      # '';
    };

    defaultPackage.x86_64-linux = self.packages.x86_64-linux.hello;

  });
}
