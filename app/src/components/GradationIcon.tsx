export const GradationIcon = ({ address, size = 40 }: { address: string, size: number }) => {
    // アドレスから色を生成する関数
    const generateColors = (addr: string) => {
      // アドレスの最初と最後の6文字を使用
      const start = addr.slice(2, 8);
      const end = addr.slice(-6);
      
      return {
        from: `#${start}`,
        to: `#${end}`
      };
    };
  
    const colors = generateColors(address);
  
    return (
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
        }}
      />
    );
};

